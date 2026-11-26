import {
  addDays,
  CALL_OUTCOME,
  CALL_QUESTION_KIND,
  CARE_PLAN_RULES,
  CARE_TASK_CATEGORY,
  DAILY_CALL_RULES,
  findMismatches,
  FAMILY_RELATIONSHIPS,
  isScheduledOn,
  localMoment,
  PATIENT_EDITOR_RELATIONSHIPS,
  zonedDateTimeToInstant,
  type CareTaskCategory,
  type recordDailyCallSchema,
  type TaskOutcome,
} from '@welcheq/shared';
import type { z } from 'zod';

import { AUDIT_ACTION, recordAuditEvent } from '@/lib/audit';
import { HttpError } from '@/lib/http-error';
import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';
import { requirePatientAccess } from '@/modules/patients/patient-access';

type RecordDailyCallData = z.output<typeof recordDailyCallSchema>;

/** The things a patient can most reliably confirm come first. */
const CATEGORY_PRIORITY: readonly CareTaskCategory[] = [
  CARE_TASK_CATEGORY.MEDICATION,
  CARE_TASK_CATEGORY.MEAL,
  CARE_TASK_CATEGORY.PERSONAL_CARE,
  CARE_TASK_CATEGORY.MOBILITY,
  CARE_TASK_CATEGORY.VITALS,
  CARE_TASK_CATEGORY.OTHER,
];

const toDateColumn = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

async function patientDetails(patientId: string) {
  return prisma.patient.findUniqueOrThrow({
    where: { id: patientId },
    select: { fullName: true, phone: true, timeZone: true },
  });
}

async function tasksDueBy(patientId: string, date: string, minutesSoFar: number) {
  const tasks = await prisma.careTask.findMany({
    where: { patientId, archivedAt: null },
    select: { id: true, title: true, category: true, minutesAfterMidnight: true, daysOfWeek: true },
  });
  return tasks
    .filter((task) => isScheduledOn(task, date) && task.minutesAfterMidnight <= minutesSoFar)
    .sort(
      (first, second) =>
        CATEGORY_PRIORITY.indexOf(first.category) - CATEGORY_PRIORITY.indexOf(second.category) ||
        first.minutesAfterMidnight - second.minutesAfterMidnight,
    )
    .slice(0, DAILY_CALL_RULES.MAX_TASK_QUESTIONS);
}

async function caregiverRecords(patientId: string, date: string, timeZone: string) {
  const [records, visitCount] = await Promise.all([
    prisma.taskRecord.findMany({
      where: { patientId, dueDate: toDateColumn(date) },
      select: { careTaskId: true, outcome: true },
    }),
    prisma.visit.count({
      where: {
        patientId,
        checkInAt: {
          gte: zonedDateTimeToInstant(date, 0, timeZone),
          lt: zonedDateTimeToInstant(addDays(date, 1), 0, timeZone),
        },
      },
    }),
  ]);
  return {
    taskOutcomes: new Map<string, TaskOutcome>(
      records.map((record) => [record.careTaskId, record.outcome]),
    ),
    hadVisitToday: visitCount > 0,
  };
}

function toCallResponse(call: {
  id: string;
  callDate: Date;
  outcome: string;
  answers: unknown;
  mismatchCount: number;
  note: string | null;
  createdAt: Date;
  caller: { fullName: string };
}) {
  return {
    id: call.id,
    date: call.callDate.toISOString().slice(0, 10),
    outcome: call.outcome,
    answers: call.answers,
    mismatchCount: call.mismatchCount,
    note: call.note,
    calledBy: call.caller.fullName,
    calledAt: call.createdAt,
  };
}

const CALL_FIELDS = {
  id: true,
  callDate: true,
  outcome: true,
  answers: true,
  mismatchCount: true,
  note: true,
  createdAt: true,
  caller: { select: { fullName: true } },
} as const;

export const dailyCallService = {
  async prepare(user: ActingUser, patientId: string) {
    await requirePatientAccess(user, patientId, FAMILY_RELATIONSHIPS);
    const patient = await patientDetails(patientId);
    const now = localMoment(new Date(), patient.timeZone);
    const tasks = await tasksDueBy(patientId, now.date, now.minutes);

    const todaysCalls = await prisma.dailyCall.findMany({
      where: { patientId, callDate: toDateColumn(now.date) },
      select: CALL_FIELDS,
      orderBy: { createdAt: 'desc' },
    });

    return {
      date: now.date,
      patientFirstName: patient.fullName.split(' ')[0] ?? patient.fullName,
      phone: patient.phone,
      questions: [
        ...tasks.map((task) => ({
          kind: CALL_QUESTION_KIND.TASK,
          taskId: task.id,
          title: task.title,
          category: task.category,
        })),
        {
          kind: CALL_QUESTION_KIND.CAREGIVER_VISITED,
          taskId: null,
          title: 'The caregiver came today',
          category: null,
        },
      ],
      todaysCalls: todaysCalls.map(toCallResponse),
    };
  },

  async record(user: ActingUser, patientId: string, input: RecordDailyCallData) {
    await requirePatientAccess(user, patientId, FAMILY_RELATIONSHIPS);
    const patient = await patientDetails(patientId);
    const today = localMoment(new Date(), patient.timeZone).date;
    const earliest = addDays(today, -CARE_PLAN_RULES.RECORDABLE_PAST_DAYS);
    if (input.date > today || input.date < earliest) {
      throw HttpError.invalid('Calls can only be recorded for today or yesterday');
    }

    const taskIds = input.answers.flatMap((answer) => (answer.taskId ? [answer.taskId] : []));
    const tasks = await prisma.careTask.findMany({
      where: { patientId, id: { in: taskIds } },
      select: { id: true, title: true },
    });
    if (tasks.length !== new Set(taskIds).size) {
      throw HttpError.invalid('Some questions do not belong to this care plan');
    }
    const titles = new Map(tasks.map((task) => [task.id, task.title]));

    const mismatches = new Set(
      findMismatches(
        input.answers,
        await caregiverRecords(patientId, input.date, patient.timeZone),
      ),
    );
    const answers = input.answers.map((answer) => ({
      ...answer,
      title: answer.taskId ? titles.get(answer.taskId) : 'The caregiver came',
      isMismatch: mismatches.has(answer),
    }));

    const call = await prisma.dailyCall.create({
      data: {
        patientId,
        callerId: user.id,
        callDate: toDateColumn(input.date),
        outcome: input.outcome,
        answers,
        mismatchCount: input.outcome === CALL_OUTCOME.REACHED ? mismatches.size : 0,
        note: input.note || null,
      },
      select: CALL_FIELDS,
    });

    return toCallResponse(call);
  },

  async history(user: ActingUser, patientId: string, from: string, to: string) {
    await requirePatientAccess(user, patientId, FAMILY_RELATIONSHIPS);
    const calls = await prisma.dailyCall.findMany({
      where: { patientId, callDate: { gte: toDateColumn(from), lte: toDateColumn(to) } },
      select: CALL_FIELDS,
      orderBy: { createdAt: 'desc' },
    });
    return calls.map(toCallResponse);
  },

  async updateContact(user: ActingUser, patientId: string, phone: string | null) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);
    await prisma.$transaction(async (tx) => {
      await tx.patient.update({ where: { id: patientId }, data: { phone } });
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.PATIENT_CONTACT_UPDATED,
        entityType: 'patient',
        entityId: patientId,
      });
    });
  },
};

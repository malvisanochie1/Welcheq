import {
  addDays,
  buildChecklist,
  CARE_PLAN_RULES,
  CARE_PLAN_TEMPLATES,
  isScheduledOn,
  localMoment,
  parseClockTime,
  PATIENT_EDITOR_RELATIONSHIPS,
  TASK_RECORDER_RELATIONSHIPS,
  type careTaskInputSchema,
  type RecordTaskInput,
  type TaskOutcome,
  type updateCareTaskSchema,
} from '@welcheq/shared';
import type { z } from 'zod';

import { AUDIT_ACTION, recordAuditEvent } from '@/lib/audit';
import { HttpError } from '@/lib/http-error';
import { prisma } from '@/lib/prisma';
import type { ActingUser } from '@/middleware/require-profile';
import { requirePatientAccess } from '@/modules/patients/patient-access';
import { carePlanRepository } from './care-plan.repository';
import { toCareTaskResponse } from './care-task.mapper';

type CareTaskData = z.output<typeof careTaskInputSchema>;
type UpdateCareTaskData = z.output<typeof updateCareTaskSchema>;

const ENTITY_TYPE = 'patient';

const toDateColumn = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

function minutesFrom(time: string): number {
  const minutes = parseClockTime(time);
  if (minutes === null) {
    throw HttpError.invalid('Use a 24-hour time like 08:30');
  }
  return minutes;
}

async function patientTimeZone(patientId: string): Promise<string> {
  const patient = await prisma.patient.findUniqueOrThrow({
    where: { id: patientId },
    select: { timeZone: true },
  });
  return patient.timeZone;
}

async function ensureRoomFor(
  db: Parameters<typeof carePlanRepository.countTasks>[0],
  patientId: string,
  additional: number,
) {
  const existing = await carePlanRepository.countTasks(db, patientId);
  if (existing + additional > CARE_PLAN_RULES.MAX_TASKS) {
    throw HttpError.conflict(`A care plan can have up to ${CARE_PLAN_RULES.MAX_TASKS} tasks.`);
  }
}

export const carePlanService = {
  async listTasks(user: ActingUser, patientId: string) {
    await requirePatientAccess(user, patientId);
    const tasks = await carePlanRepository.listTasks(patientId);
    return tasks.map(toCareTaskResponse);
  },

  async addTask(user: ActingUser, patientId: string, input: CareTaskData) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);

    const task = await prisma.$transaction(async (tx) => {
      await ensureRoomFor(tx, patientId, 1);
      const created = await carePlanRepository.createTask(tx, {
        patientId,
        title: input.title,
        category: input.category,
        instructions: input.instructions || null,
        minutesAfterMidnight: minutesFrom(input.time),
        daysOfWeek: input.daysOfWeek,
        createdById: user.id,
      });
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.CARE_PLAN_CHANGED,
        entityType: ENTITY_TYPE,
        entityId: patientId,
        metadata: { change: 'task_added', taskId: created.id },
      });
      return created;
    });

    return toCareTaskResponse(task);
  },

  async applyTemplate(user: ActingUser, patientId: string, templateId: string) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);

    const template = CARE_PLAN_TEMPLATES.find((candidate) => candidate.id === templateId);
    if (!template) {
      throw HttpError.notFound('Template not found');
    }

    const existingTitles = new Set(
      (await carePlanRepository.listTasks(patientId)).map((task) => task.title.toLowerCase()),
    );
    const newTasks = template.tasks.filter((task) => !existingTitles.has(task.title.toLowerCase()));

    await prisma.$transaction(async (tx) => {
      await ensureRoomFor(tx, patientId, newTasks.length);
      await carePlanRepository.createTasks(
        tx,
        newTasks.map((task) => ({
          patientId,
          title: task.title,
          category: task.category,
          instructions: task.instructions ?? null,
          minutesAfterMidnight: minutesFrom(task.time),
          daysOfWeek: [],
          createdById: user.id,
        })),
      );
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.CARE_PLAN_CHANGED,
        entityType: ENTITY_TYPE,
        entityId: patientId,
        metadata: { change: 'template_applied', templateId, added: newTasks.length },
      });
    });

    return this.listTasks(user, patientId);
  },

  async updateTask(user: ActingUser, patientId: string, taskId: string, input: UpdateCareTaskData) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);
    if (!(await carePlanRepository.findTask(patientId, taskId))) {
      throw HttpError.notFound('Task not found');
    }

    const task = await prisma.$transaction(async (tx) => {
      const updated = await carePlanRepository.updateTask(tx, taskId, {
        title: input.title,
        category: input.category,
        instructions: input.instructions === undefined ? undefined : input.instructions || null,
        minutesAfterMidnight: input.time === undefined ? undefined : minutesFrom(input.time),
        daysOfWeek: input.daysOfWeek,
      });
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.CARE_PLAN_CHANGED,
        entityType: ENTITY_TYPE,
        entityId: patientId,
        metadata: { change: 'task_updated', taskId, fields: Object.keys(input) },
      });
      return updated;
    });

    return toCareTaskResponse(task);
  },

  async removeTask(user: ActingUser, patientId: string, taskId: string) {
    await requirePatientAccess(user, patientId, PATIENT_EDITOR_RELATIONSHIPS);
    if (!(await carePlanRepository.findTask(patientId, taskId))) {
      throw HttpError.notFound('Task not found');
    }

    await prisma.$transaction(async (tx) => {
      await carePlanRepository.updateTask(tx, taskId, { archivedAt: new Date() });
      await recordAuditEvent(tx, {
        actorId: user.id,
        action: AUDIT_ACTION.CARE_PLAN_CHANGED,
        entityType: ENTITY_TYPE,
        entityId: patientId,
        metadata: { change: 'task_removed', taskId },
      });
    });
  },

  async checklist(user: ActingUser, patientId: string, requestedDate: string | undefined) {
    const relationship = await requirePatientAccess(user, patientId);
    const timeZone = await patientTimeZone(patientId);
    const now = localMoment(new Date(), timeZone);
    const date = requestedDate ?? now.date;

    const [tasks, records] = await Promise.all([
      carePlanRepository.listTasks(patientId),
      carePlanRepository.listRecords(patientId, toDateColumn(date)),
    ]);
    const recordsByTask = new Map(records.map((record) => [record.careTaskId, record]));
    const outcomes = new Map<string, TaskOutcome>(
      records.map((record) => [record.careTaskId, record.outcome]),
    );

    return {
      date,
      today: now.date,
      timeZone,
      canRecord: (TASK_RECORDER_RELATIONSHIPS as readonly string[]).includes(relationship),
      items: buildChecklist(tasks, date, now, outcomes).map(({ task, status }) => {
        const record = recordsByTask.get(task.id);
        return {
          task: toCareTaskResponse(task),
          status,
          record: record
            ? {
                outcome: record.outcome,
                note: record.note,
                recordedBy: record.recordedBy.fullName,
                recordedAt: record.recordedAt,
              }
            : null,
        };
      }),
    };
  },

  async recordTask(user: ActingUser, patientId: string, taskId: string, input: RecordTaskInput) {
    await requirePatientAccess(user, patientId, TASK_RECORDER_RELATIONSHIPS);

    const task = await carePlanRepository.findTask(patientId, taskId);
    if (!task) {
      throw HttpError.notFound('Task not found');
    }

    const today = localMoment(new Date(), await patientTimeZone(patientId)).date;
    const earliest = addDays(today, -CARE_PLAN_RULES.RECORDABLE_PAST_DAYS);
    if (input.date > today || input.date < earliest) {
      throw HttpError.invalid('Tasks can only be recorded for today or yesterday');
    }
    if (!isScheduledOn(task, input.date)) {
      throw HttpError.invalid('This task is not planned for that day');
    }

    const dueDate = toDateColumn(input.date);
    await prisma.$transaction(async (tx) => {
      const previous = await carePlanRepository.findRecord(tx, taskId, dueDate);
      await carePlanRepository.upsertRecord(tx, {
        careTaskId: taskId,
        patientId,
        dueDate,
        outcome: input.outcome,
        note: input.note || null,
        recordedById: user.id,
      });
      if (previous) {
        await recordAuditEvent(tx, {
          actorId: user.id,
          action: AUDIT_ACTION.TASK_RECORD_CHANGED,
          entityType: ENTITY_TYPE,
          entityId: patientId,
          metadata: {
            taskId,
            date: input.date,
            previous: { outcome: previous.outcome, note: previous.note, by: previous.recordedById },
          },
        });
      }
    });

    return this.checklist(user, patientId, input.date);
  },
};

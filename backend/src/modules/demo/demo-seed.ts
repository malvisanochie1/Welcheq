import {
  addDays,
  ALLERGY_SEVERITY,
  ATTENDANCE_FLAG,
  CALL_ANSWER,
  CALL_OUTCOME,
  CALL_QUESTION_KIND,
  CARE_RELATIONSHIP,
  INCIDENT_CATEGORY,
  INCIDENT_SEVERITY,
  INCIDENT_STATUS,
  localMoment,
  NOTIFICATION_KIND,
  PROOF_METHOD,
  READING_SOURCE,
  READING_TYPE,
  USER_ROLE,
  WELLBEING,
  zonedDateTimeToInstant,
  type AttendanceFlag,
  type Wellbeing,
} from '@welcheq/shared';

import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { DEMO_EXTRA_PEOPLE, DEMO_RULES } from './demo.constants';

type Tx = Prisma.TransactionClient;
type Rows<T extends keyof Tx> = Tx[T] extends { createMany: (args: { data: infer D }) => unknown }
  ? D extends readonly (infer Row)[]
    ? Row[]
    : never
  : never;

export interface DemoSignIns {
  familyId: string;
  caregiverId: string;
}

const MINUTE = 1;
const HOUR = 60 * MINUTE;
const { TIME_ZONE } = DEMO_RULES;
const RESEED_AFTER_MS = DEMO_RULES.RESEED_AFTER_HOURS * 3_600_000;

/** A stable sequence of choices, so the demo looks the same for everyone on a given day. */
function pick<T>(items: readonly T[], seed: number): T {
  return items[Math.abs(seed) % items.length] as T;
}

const at = (date: string, minutes: number) => zonedDateTimeToInstant(date, minutes, TIME_ZONE);

const REPORT_NOTES: Readonly<Record<Wellbeing, readonly string[]>> = {
  [WELLBEING.GOOD]: [
    'Ate all her breakfast and asked for more pap. Walked to the gate with me.',
    'In good spirits, we listened to the radio together after lunch.',
    'Slept well last night. Took all her medicine without fuss.',
  ],
  [WELLBEING.OKAY]: [
    'A little tired after lunch, rested for an hour. Drank plenty of water.',
    'Complained of stiff knees in the morning, better after the walk.',
  ],
  [WELLBEING.UNWELL]: [
    'Felt dizzy when standing up. Kept her seated and checked her pressure twice.',
  ],
};

interface PatientPlan {
  id: string;
  fullName: string;
  caregiverId: string;
  visitStart: number;
  visitEnd: number;
  tasks: Array<{ title: string; category: Rows<'careTask'>[number]['category']; time: number }>;
}

function buildHistory(plan: PatientPlan, today: string, now: Date, familyId: string) {
  const shifts: Rows<'shift'> = [];
  const visits: Rows<'visit'> = [];
  const reports: Rows<'visitReport'> = [];
  const readings: Rows<'healthReading'> = [];
  const records: Rows<'taskRecord'> = [];
  const taskIds = plan.tasks.map((task, index) => ({ ...task, id: crypto.randomUUID(), index }));

  for (let offset = -DEMO_RULES.HISTORY_DAYS; offset <= DEMO_RULES.UPCOMING_DAYS; offset += 1) {
    const date = addDays(today, offset);
    const seed = offset * 7 + plan.visitStart;
    const shiftId = crypto.randomUUID();
    const startsAt = at(date, plan.visitStart);
    const endsAt = at(date, plan.visitEnd);
    shifts.push({
      id: shiftId,
      patientId: plan.id,
      caregiverId: plan.caregiverId,
      startsAt,
      endsAt,
      createdById: familyId,
    });

    const isMissed = offset === -5 && plan.visitStart > 12 * HOUR;
    const lateBy = pick([0, 0, 0, 0, 5, 0, 25], seed);
    const checkInAt = at(date, plan.visitStart + lateBy + 2);
    if (isMissed || checkInAt > now) continue;

    const leftEarly = offset === -9;
    const checkOutAt = at(date, plan.visitEnd - (leftEarly ? 50 : 4));
    const isOpen = checkOutAt > now;
    const flags: AttendanceFlag[] = [
      ...(lateBy > 15 ? [ATTENDANCE_FLAG.LATE_ARRIVAL] : []),
      ...(leftEarly && !isOpen ? [ATTENDANCE_FLAG.EARLY_DEPARTURE] : []),
    ];
    const visitId = crypto.randomUUID();
    visits.push({
      id: visitId,
      patientId: plan.id,
      caregiverId: plan.caregiverId,
      shiftId,
      openForCaregiverId: isOpen ? plan.caregiverId : null,
      checkInAt,
      checkInClientAt: checkInAt,
      checkInLatitude: 6.4416,
      checkInLongitude: 7.4991,
      checkInAccuracyMeters: 12,
      checkInDistanceMeters: 18,
      ...(isOpen
        ? {}
        : {
            checkOutAt,
            checkOutClientAt: checkOutAt,
            checkOutLatitude: 6.4415,
            checkOutLongitude: 7.4989,
            checkOutAccuracyMeters: 10,
            checkOutDistanceMeters: 15,
          }),
      flags,
    });

    for (const task of taskIds) {
      const dueAt = at(date, task.time);
      if (dueAt > now) continue;
      const isSkipped = (seed + task.index) % 11 === 0;
      records.push({
        careTaskId: task.id,
        patientId: plan.id,
        dueDate: new Date(`${date}T00:00:00Z`),
        outcome: isSkipped ? 'NOT_DONE' : 'DONE',
        note: isSkipped ? 'She was asleep, will try again after lunch.' : null,
        recordedById: plan.caregiverId,
        recordedAt: new Date(dueAt.getTime() + 6 * 60_000),
      });
    }

    if (isOpen) continue;
    const wellbeing =
      offset === -3
        ? WELLBEING.UNWELL
        : pick([WELLBEING.GOOD, WELLBEING.GOOD, WELLBEING.OKAY], seed);
    reports.push({
      visitId,
      patientId: plan.id,
      authorId: plan.caregiverId,
      wellbeing,
      notes: pick(REPORT_NOTES[wellbeing], seed),
      createdAt: checkOutAt,
      updatedAt: checkOutAt,
    });
    const measuredAt = new Date(checkInAt.getTime() + 45 * 60_000);
    readings.push(
      plan.visitStart < 12 * HOUR
        ? {
            patientId: plan.id,
            visitId,
            type: READING_TYPE.BLOOD_PRESSURE,
            value: 128 + Math.abs(seed % 17) + (wellbeing === WELLBEING.UNWELL ? 14 : 0),
            secondaryValue: 80 + Math.abs(seed % 9),
            unit: 'mmHg',
            measuredAt,
            source: READING_SOURCE.CAREGIVER,
            recordedById: plan.caregiverId,
          }
        : {
            patientId: plan.id,
            visitId,
            type: READING_TYPE.BLOOD_GLUCOSE,
            value: 104 + Math.abs(seed % 38),
            secondaryValue: null,
            unit: 'mg/dL',
            measuredAt,
            source: READING_SOURCE.CAREGIVER,
            recordedById: plan.caregiverId,
          },
    );
  }

  return { shifts, visits, reports, readings, records, tasks: taskIds };
}

async function upsertPeople(
  tx: Tx,
  signIns: DemoSignIns,
  emails: { family: string; caregiver: string },
) {
  const people = [
    {
      id: signIns.familyId,
      email: emails.family,
      fullName: 'Adaeze Okafor',
      role: USER_ROLE.FAMILY,
      phone: '+234 803 555 0101',
    },
    {
      id: signIns.caregiverId,
      email: emails.caregiver,
      fullName: 'Chika Eze',
      role: USER_ROLE.CAREGIVER,
      phone: '+234 803 555 0199',
    },
    {
      id: DEMO_EXTRA_PEOPLE.SIBLING.id,
      email: 'sibling@demo.welcheq.example',
      fullName: DEMO_EXTRA_PEOPLE.SIBLING.fullName,
      role: USER_ROLE.FAMILY,
      phone: null,
    },
    {
      id: DEMO_EXTRA_PEOPLE.SECOND_CAREGIVER.id,
      email: 'second-caregiver@demo.welcheq.example',
      fullName: DEMO_EXTRA_PEOPLE.SECOND_CAREGIVER.fullName,
      role: USER_ROLE.CAREGIVER,
      phone: '+234 806 555 0142',
    },
  ];
  for (const person of people) {
    await tx.user.upsert({
      where: { id: person.id },
      create: { ...person, isDemo: true },
      update: { fullName: person.fullName, role: person.role, phone: person.phone, isDemo: true },
    });
  }
}

/** Rebuilds every demo record around today, so the demo always shows a live, believable week. */
export async function seedDemo(
  signIns: DemoSignIns,
  emails: { family: string; caregiver: string },
) {
  const now = new Date();
  const today = localMoment(now, TIME_ZONE).date;
  const familyId = signIns.familyId;
  const siblingId = DEMO_EXTRA_PEOPLE.SIBLING.id;
  const secondCaregiverId = DEMO_EXTRA_PEOPLE.SECOND_CAREGIVER.id;
  const caregiverId = signIns.caregiverId;

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${DEMO_RULES.SEED_LOCK_KEY})`;
      const lastSeed = await tx.demoSeed.findUnique({ where: { id: DEMO_RULES.SEED_ROW_ID } });
      if (lastSeed && now.getTime() - lastSeed.seededAt.getTime() < RESEED_AFTER_MS) return;

      const demoUsers = await tx.user.findMany({ where: { isDemo: true }, select: { id: true } });
      const demoIds = demoUsers.map(({ id }) => id);
      await tx.notification.deleteMany({ where: { userId: { in: demoIds } } });
      await tx.patient.deleteMany({ where: { createdById: { in: demoIds } } });
      await tx.user.deleteMany({
        where: {
          isDemo: true,
          id: { notIn: [familyId, caregiverId, siblingId, secondCaregiverId] },
        },
      });
      await upsertPeople(tx, signIns, emails);

      const mother: PatientPlan = {
        id: crypto.randomUUID(),
        fullName: 'Ngozi Okafor',
        caregiverId,
        visitStart: 8 * HOUR,
        visitEnd: 14 * HOUR,
        tasks: [
          {
            title: 'Morning wash and change of clothes',
            category: 'PERSONAL_CARE',
            time: 8 * HOUR + 15,
          },
          { title: 'Breakfast', category: 'MEAL', time: 8 * HOUR + 45 },
          { title: 'Morning blood pressure medicine', category: 'MEDICATION', time: 9 * HOUR },
          { title: 'Check blood pressure', category: 'VITALS', time: 9 * HOUR + 30 },
          { title: 'Short walk to the gate', category: 'MOBILITY', time: 11 * HOUR },
          { title: 'Lunch', category: 'MEAL', time: 13 * HOUR },
        ],
      };
      const father: PatientPlan = {
        id: crypto.randomUUID(),
        fullName: 'Samuel Okafor',
        caregiverId: secondCaregiverId,
        visitStart: 15 * HOUR,
        visitEnd: 20 * HOUR,
        tasks: [
          { title: 'Check blood sugar before dinner', category: 'VITALS', time: 18 * HOUR + 30 },
          { title: 'Dinner', category: 'MEAL', time: 19 * HOUR },
          { title: 'Evening diabetes medicine', category: 'MEDICATION', time: 19 * HOUR + 30 },
        ],
      };

      await tx.patient.createMany({
        data: [
          {
            id: mother.id,
            createdById: familyId,
            fullName: mother.fullName,
            dateOfBirth: new Date('1948-03-14T00:00:00Z'),
            homeAddress: '12 Ogui Road, Enugu',
            homeLatitude: 6.4413,
            homeLongitude: 7.4988,
            proofMethods: [PROOF_METHOD.LOCATION, PROOF_METHOD.ROTATING_CODE],
            timeZone: TIME_ZONE,
            phone: '+234 803 555 0177',
          },
          {
            id: father.id,
            createdById: familyId,
            fullName: father.fullName,
            dateOfBirth: new Date('1945-09-02T00:00:00Z'),
            homeAddress: '4 Zik Avenue, Enugu',
            homeLatitude: 6.4521,
            homeLongitude: 7.5103,
            proofMethods: [PROOF_METHOD.LOCATION],
            timeZone: TIME_ZONE,
          },
        ],
      });
      await tx.patientAccess.createMany({
        data: [
          { patientId: mother.id, userId: familyId, relationship: CARE_RELATIONSHIP.OWNER },
          { patientId: father.id, userId: familyId, relationship: CARE_RELATIONSHIP.OWNER },
          {
            patientId: mother.id,
            userId: siblingId,
            relationship: CARE_RELATIONSHIP.FAMILY_VIEWER,
            grantedById: familyId,
          },
          {
            patientId: mother.id,
            userId: caregiverId,
            relationship: CARE_RELATIONSHIP.CAREGIVER,
            grantedById: familyId,
          },
          {
            patientId: father.id,
            userId: caregiverId,
            relationship: CARE_RELATIONSHIP.CAREGIVER,
            grantedById: familyId,
          },
          {
            patientId: father.id,
            userId: secondCaregiverId,
            relationship: CARE_RELATIONSHIP.CAREGIVER,
            grantedById: familyId,
          },
        ],
      });

      for (const plan of [mother, father]) {
        const history = buildHistory(plan, today, now, familyId);
        await tx.careTask.createMany({
          data: history.tasks.map((task) => ({
            id: task.id,
            patientId: plan.id,
            title: task.title,
            category: task.category,
            minutesAfterMidnight: task.time,
            daysOfWeek: [],
            createdById: familyId,
          })),
        });
        await tx.shift.createMany({ data: history.shifts });
        await tx.visit.createMany({ data: history.visits });
        await tx.taskRecord.createMany({ data: history.records });
        await tx.visitReport.createMany({ data: history.reports });
        await tx.healthReading.createMany({ data: history.readings });
      }

      await tx.healthReading.create({
        data: {
          patientId: mother.id,
          type: READING_TYPE.WEIGHT,
          value: 63.8,
          unit: 'kg',
          measuredAt: at(addDays(today, -2), 18 * HOUR),
          source: READING_SOURCE.FAMILY,
          recordedById: familyId,
        },
      });

      await tx.medication.createMany({
        data: [
          {
            patientId: mother.id,
            name: 'Amlodipine',
            dose: '5 mg',
            instructions: 'One tablet every morning after breakfast',
            createdById: familyId,
          },
          {
            patientId: mother.id,
            name: 'Calcium with vitamin D',
            dose: '600 mg',
            instructions: 'One tablet with lunch',
            createdById: familyId,
          },
          {
            patientId: mother.id,
            name: 'Lisinopril',
            dose: '10 mg',
            instructions: null,
            stoppedAt: at(addDays(today, -40), 9 * HOUR),
            createdById: familyId,
          },
          {
            patientId: father.id,
            name: 'Metformin',
            dose: '500 mg',
            instructions: 'One tablet with dinner',
            createdById: familyId,
          },
        ],
      });
      await tx.allergy.createMany({
        data: [
          {
            patientId: mother.id,
            substance: 'Penicillin',
            reaction: 'Rash and swelling',
            severity: ALLERGY_SEVERITY.SEVERE,
            createdById: familyId,
          },
          {
            patientId: mother.id,
            substance: 'Groundnuts',
            reaction: 'Itchy throat',
            severity: ALLERGY_SEVERITY.MILD,
            createdById: familyId,
          },
        ],
      });
      await tx.condition.createMany({
        data: [
          {
            patientId: mother.id,
            name: 'High blood pressure',
            notes: 'Reviewed by Dr Obi every three months',
            diagnosedOn: new Date('2017-01-01T00:00:00Z'),
            createdById: familyId,
          },
          {
            patientId: mother.id,
            name: 'Osteoarthritis of the knees',
            notes: null,
            diagnosedOn: new Date('2020-01-01T00:00:00Z'),
            createdById: familyId,
          },
          {
            patientId: father.id,
            name: 'Type 2 diabetes',
            notes: 'Check sugar before dinner',
            diagnosedOn: new Date('2012-01-01T00:00:00Z'),
            createdById: familyId,
          },
        ],
      });

      const fallAt = at(addDays(today, -3), 10 * HOUR + 20);
      await tx.incident.createMany({
        data: [
          {
            patientId: mother.id,
            reportedById: caregiverId,
            category: INCIDENT_CATEGORY.FALL,
            severity: INCIDENT_SEVERITY.MEDIUM,
            description:
              'Slipped on the bathroom floor. Bruised her left arm, no bleeding, able to stand with help.',
            occurredAt: fallAt,
            status: INCIDENT_STATUS.RESOLVED,
            resolutionNote: 'Seen by Dr Obi the same day, no fracture. Non-slip mat fitted.',
            resolvedAt: at(addDays(today, -2), 12 * HOUR),
            resolvedById: familyId,
            createdAt: fallAt,
          },
          {
            patientId: father.id,
            reportedById: secondCaregiverId,
            category: INCIDENT_CATEGORY.MISSED_MEDICATION,
            severity: INCIDENT_SEVERITY.MEDIUM,
            description:
              'Evening diabetes tablet not taken: the pack was empty. Family to collect a refill.',
            occurredAt: at(addDays(today, -1), 19 * HOUR + 35),
            status: INCIDENT_STATUS.OPEN,
            createdAt: at(addDays(today, -1), 19 * HOUR + 40),
          },
        ],
      });

      const messages: Array<[string, string, number, number]> = [
        [
          familyId,
          'Please check her feet today, she said they were swollen yesterday.',
          -2,
          8 * HOUR + 10,
        ],
        [
          caregiverId,
          'Will do. They look a bit better this morning, I raised them while she rested.',
          -2,
          10 * HOUR,
        ],
        [siblingId, 'I will bring the new blood pressure tablets on Saturday.', -1, 18 * HOUR],
        [
          familyId,
          'Thank you Chika. Mum asked for pepper soup tonight if there is time.',
          -1,
          12 * HOUR + 30,
        ],
        [caregiverId, 'She enjoyed it. All tasks done, see you tomorrow.', -1, 13 * HOUR + 55],
      ];
      await tx.message.createMany({
        data: messages.map(([authorId, body, dayOffset, minutes]) => ({
          patientId: mother.id,
          authorId,
          body,
          createdAt: at(addDays(today, dayOffset), minutes),
        })),
      });

      await tx.caregiverReview.createMany({
        data: [
          {
            patientId: mother.id,
            caregiverId,
            reviewerId: familyId,
            rating: 5,
            comment: 'Always on time and very gentle with mum.',
          },
          {
            patientId: mother.id,
            caregiverId,
            reviewerId: siblingId,
            rating: 4,
            comment: 'Keeps us updated every day.',
          },
          {
            patientId: father.id,
            caregiverId: secondCaregiverId,
            reviewerId: familyId,
            rating: 4,
            comment: null,
          },
        ],
      });

      const motherTasks = await tx.careTask.findMany({
        where: { patientId: mother.id, category: 'MEDICATION' },
        select: { id: true, title: true },
        take: 1,
      });
      const medicineTask = motherTasks[0];
      await tx.dailyCall.createMany({
        data: [-1, -2, -4].map((dayOffset) => ({
          patientId: mother.id,
          callerId: familyId,
          callDate: new Date(`${addDays(today, dayOffset)}T00:00:00Z`),
          outcome: CALL_OUTCOME.REACHED,
          answers: [
            {
              kind: CALL_QUESTION_KIND.CAREGIVER_VISITED,
              taskId: null,
              answer: CALL_ANSWER.YES,
              title: 'The caregiver came',
              isMismatch: false,
            },
            ...(medicineTask
              ? [
                  {
                    kind: CALL_QUESTION_KIND.TASK,
                    taskId: medicineTask.id,
                    answer: dayOffset === -4 ? CALL_ANSWER.NO : CALL_ANSWER.YES,
                    title: medicineTask.title,
                    isMismatch: dayOffset === -4,
                  },
                ]
              : []),
          ],
          mismatchCount: dayOffset === -4 ? 1 : 0,
          note: dayOffset === -4 ? 'Mum was not sure she took it, will ask Chika.' : null,
          createdAt: at(addDays(today, dayOffset), 19 * HOUR),
        })),
      });

      const todaysVisit = await tx.visit.findFirst({
        where: { patientId: mother.id, checkInAt: { gte: at(today, 0) } },
        select: { id: true, checkInAt: true },
      });
      await tx.notification.createMany({
        data: [
          ...(todaysVisit
            ? [
                {
                  userId: familyId,
                  patientId: mother.id,
                  kind: NOTIFICATION_KIND.CAREGIVER_ARRIVED,
                  title: 'Chika arrived',
                  body: "Checked in at Ngozi's home.",
                  entityId: todaysVisit.id,
                  dedupeKey: 'demo:arrived',
                  createdAt: todaysVisit.checkInAt,
                },
              ]
            : []),
          {
            userId: familyId,
            patientId: father.id,
            kind: NOTIFICATION_KIND.INCIDENT_REPORTED,
            title: 'Incident: Missed medicine',
            body: 'Tunde reported something about Samuel.',
            dedupeKey: 'demo:incident',
            createdAt: at(addDays(today, -1), 19 * HOUR + 40),
          },
          {
            userId: familyId,
            patientId: mother.id,
            kind: NOTIFICATION_KIND.MESSAGE,
            title: 'Message from Chika',
            body: 'She enjoyed it. All tasks done, see you tomorrow.',
            dedupeKey: 'demo:message',
            createdAt: at(addDays(today, -1), 13 * HOUR + 55),
            readAt: at(addDays(today, -1), 15 * HOUR),
          },
          {
            userId: caregiverId,
            patientId: mother.id,
            kind: NOTIFICATION_KIND.MESSAGE,
            title: 'Message from Adaeze',
            body: 'Thank you Chika. Mum asked for pepper soup tonight if there is time.',
            dedupeKey: 'demo:message',
            createdAt: at(addDays(today, -1), 12 * HOUR + 30),
          },
        ],
      });

      await tx.demoSeed.upsert({
        where: { id: DEMO_RULES.SEED_ROW_ID },
        create: { id: DEMO_RULES.SEED_ROW_ID, seededAt: now },
        update: { seededAt: now },
      });
    },
    { timeout: 60_000 },
  );
}

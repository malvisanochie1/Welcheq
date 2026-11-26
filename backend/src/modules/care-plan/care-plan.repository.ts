import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { CARE_TASK_FIELDS } from './care-task.mapper';

const activeTasks = (patientId: string) => ({ patientId, archivedAt: null });

export const carePlanRepository = {
  listTasks(patientId: string) {
    return prisma.careTask.findMany({
      where: activeTasks(patientId),
      select: CARE_TASK_FIELDS,
      orderBy: [{ minutesAfterMidnight: 'asc' }, { title: 'asc' }],
    });
  },

  countTasks(db: Prisma.TransactionClient, patientId: string) {
    return db.careTask.count({ where: activeTasks(patientId) });
  },

  findTask(patientId: string, taskId: string) {
    return prisma.careTask.findFirst({
      where: { ...activeTasks(patientId), id: taskId },
      select: CARE_TASK_FIELDS,
    });
  },

  createTasks(db: Prisma.TransactionClient, tasks: Prisma.CareTaskCreateManyInput[]) {
    return db.careTask.createMany({ data: tasks });
  },

  createTask(db: Prisma.TransactionClient, task: Prisma.CareTaskUncheckedCreateInput) {
    return db.careTask.create({ data: task, select: CARE_TASK_FIELDS });
  },

  updateTask(db: Prisma.TransactionClient, taskId: string, data: Prisma.CareTaskUpdateInput) {
    return db.careTask.update({ where: { id: taskId }, data, select: CARE_TASK_FIELDS });
  },

  listRecords(patientId: string, dueDate: Date) {
    return prisma.taskRecord.findMany({
      where: { patientId, dueDate },
      select: {
        careTaskId: true,
        outcome: true,
        note: true,
        recordedAt: true,
        recordedBy: { select: { fullName: true } },
      },
    });
  },

  findRecord(db: Prisma.TransactionClient, careTaskId: string, dueDate: Date) {
    return db.taskRecord.findUnique({
      where: { careTaskId_dueDate: { careTaskId, dueDate } },
      select: { outcome: true, note: true, recordedById: true },
    });
  },

  upsertRecord(
    db: Prisma.TransactionClient,
    data: Omit<Prisma.TaskRecordUncheckedCreateInput, 'id' | 'recordedAt'>,
  ) {
    const { careTaskId, dueDate } = data;
    return db.taskRecord.upsert({
      where: { careTaskId_dueDate: { careTaskId, dueDate } },
      create: data,
      update: {
        outcome: data.outcome,
        note: data.note,
        recordedById: data.recordedById,
        recordedAt: new Date(),
      },
    });
  },
};

import { CARE_TASK_CATEGORY, type CareTaskCategory } from '../constants/care-plan';

export interface CareTaskTemplate {
  title: string;
  category: CareTaskCategory;
  time: string;
  instructions?: string;
}

export interface CarePlanTemplate {
  id: string;
  name: string;
  description: string;
  tasks: readonly CareTaskTemplate[];
}

const DAILY_BASICS: readonly CareTaskTemplate[] = [
  {
    title: 'Morning wash and change of clothes',
    category: CARE_TASK_CATEGORY.PERSONAL_CARE,
    time: '08:00',
  },
  { title: 'Breakfast', category: CARE_TASK_CATEGORY.MEAL, time: '08:30' },
  { title: 'Lunch', category: CARE_TASK_CATEGORY.MEAL, time: '13:00' },
  { title: 'Water: offer a full glass', category: CARE_TASK_CATEGORY.MEAL, time: '15:00' },
  { title: 'Short walk or stretching', category: CARE_TASK_CATEGORY.MOBILITY, time: '16:00' },
  { title: 'Dinner', category: CARE_TASK_CATEGORY.MEAL, time: '19:00' },
];

export const CARE_PLAN_TEMPLATES: readonly CarePlanTemplate[] = [
  {
    id: 'elderly-high-blood-pressure',
    name: 'Elderly with high blood pressure',
    description: 'Daily basics, morning and evening medicine, and a midday blood pressure check.',
    tasks: [
      ...DAILY_BASICS,
      {
        title: 'Morning blood pressure medicine',
        category: CARE_TASK_CATEGORY.MEDICATION,
        time: '09:00',
        instructions: 'Give with water after breakfast.',
      },
      {
        title: 'Check blood pressure',
        category: CARE_TASK_CATEGORY.VITALS,
        time: '12:00',
        instructions: 'Seated, after 5 minutes of rest.',
      },
      {
        title: 'Evening blood pressure medicine',
        category: CARE_TASK_CATEGORY.MEDICATION,
        time: '20:00',
      },
    ],
  },
  {
    id: 'elderly-diabetes',
    name: 'Elderly with diabetes',
    description: 'Daily basics, sugar checks before meals and diabetes medicine.',
    tasks: [
      ...DAILY_BASICS,
      {
        title: 'Check blood sugar before breakfast',
        category: CARE_TASK_CATEGORY.VITALS,
        time: '07:45',
      },
      {
        title: 'Morning diabetes medicine',
        category: CARE_TASK_CATEGORY.MEDICATION,
        time: '08:45',
      },
      {
        title: 'Check blood sugar before dinner',
        category: CARE_TASK_CATEGORY.VITALS,
        time: '18:45',
      },
      {
        title: 'Evening diabetes medicine',
        category: CARE_TASK_CATEGORY.MEDICATION,
        time: '19:30',
      },
    ],
  },
  {
    id: 'general-elderly-care',
    name: 'General elderly care',
    description: 'Meals, hygiene, water and gentle movement through the day.',
    tasks: DAILY_BASICS,
  },
];

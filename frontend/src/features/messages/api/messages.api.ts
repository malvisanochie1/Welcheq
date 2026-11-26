import { apiRequest } from '@/lib/api-client';

export interface CareTeamMessage {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; fullName: string };
}

const messagesPath = (patientId: string) =>
  `/v1/patients/${encodeURIComponent(patientId)}/messages`;

export const messagesApi = {
  list: (patientId: string) => apiRequest<CareTeamMessage[]>(messagesPath(patientId)),
  send: (patientId: string, body: string) =>
    apiRequest<CareTeamMessage>(messagesPath(patientId), { method: 'POST', body: { body } }),
};

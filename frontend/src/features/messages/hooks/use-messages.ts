import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { messagesApi } from '../api/messages.api';

const REFRESH_MS = 10_000;
const messagesKey = (patientId: string) => ['messages', patientId] as const;

export function useMessages(patientId: string) {
  return useQuery({
    queryKey: messagesKey(patientId),
    queryFn: () => messagesApi.list(patientId),
    refetchInterval: REFRESH_MS,
  });
}

export function useSendMessage(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => messagesApi.send(patientId, body),
    onSuccess: (sent) =>
      queryClient.setQueryData(messagesKey(patientId), (current: (typeof sent)[] | undefined) => [
        ...(current ?? []),
        sent,
      ]),
  });
}

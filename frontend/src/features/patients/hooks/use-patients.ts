import type { ProofSettingsInput } from '@welcheq/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { patientsApi, type Patient } from '../api/patients.api';

export const PATIENTS_QUERY_KEY = ['patients'] as const;

const patientQueryKey = (patientId: string) => [...PATIENTS_QUERY_KEY, patientId] as const;

export function usePatients() {
  return useQuery({ queryKey: PATIENTS_QUERY_KEY, queryFn: patientsApi.list });
}

/** Opens instantly from the list cache, then refreshes in the background. */
export function usePatient(patientId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: patientQueryKey(patientId),
    queryFn: () => patientsApi.get(patientId),
    placeholderData: () =>
      queryClient
        .getQueryData<Patient[]>(PATIENTS_QUERY_KEY)
        ?.find((patient) => patient.id === patientId),
  });
}

function useStorePatient() {
  const queryClient = useQueryClient();

  return (patient: Patient) => {
    queryClient.setQueryData(patientQueryKey(patient.id), patient);
    return queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY, exact: true });
  };
}

export function useCreatePatient() {
  const storePatient = useStorePatient();
  return useMutation({ mutationFn: patientsApi.create, onSuccess: storePatient });
}

export function useUpdateProofSettings(patientId: string) {
  const storePatient = useStorePatient();
  return useMutation({
    mutationFn: (input: ProofSettingsInput) => patientsApi.updateProofSettings(patientId, input),
    onSuccess: storePatient,
  });
}

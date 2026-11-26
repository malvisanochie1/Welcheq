import { Platform, Share } from 'react-native';

import { apiRequest } from '@/lib/api-client';

const FILE_PREFIX = 'health-record';
const JSON_INDENT = 2;

/** Saves the record as a FHIR file on the web, or opens the share sheet on a phone. */
export async function shareHealthRecord(patientId: string, patientName: string): Promise<void> {
  const bundle = await apiRequest<object>(`/v1/patients/${encodeURIComponent(patientId)}/fhir`);
  const contents = JSON.stringify(bundle, null, JSON_INDENT);
  const fileName = `${FILE_PREFIX}-${patientName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([contents], { type: 'application/fhir+json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  await Share.share({ title: fileName, message: contents });
}

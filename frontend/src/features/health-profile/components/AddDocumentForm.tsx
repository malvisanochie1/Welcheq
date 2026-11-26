import { HEALTH_PROFILE_LIMITS } from '@welcheq/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { TextField } from '@/components/ui/TextField';
import { describeRequestError } from '@/lib/form-errors';
import { PhotoUploadError } from '@/lib/photo-upload';
import { radius } from '@/theme';
import { useHealthDocumentChange } from '../hooks/use-health-profile';
import {
  DocumentPhotoError,
  pickDocumentPhoto,
  saveDocumentPhoto,
  type DocumentSource,
} from '../lib/document-photo';
import { FormActions } from './FormActions';

const PREVIEW_ASPECT_RATIO = 3 / 4;

export interface AddDocumentFormProps {
  patientId: string;
  onDone: () => void;
}

export function AddDocumentForm({ patientId, onDone }: AddDocumentFormProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const save = useHealthDocumentChange(patientId, (uri: string) =>
    saveDocumentPhoto(patientId, title.trim(), uri),
  );

  const choose = async (source: DocumentSource) => {
    setFormError(null);
    try {
      const uri = await pickDocumentPhoto(source);
      if (uri) setPhotoUri(uri);
    } catch (error) {
      setFormError(error instanceof DocumentPhotoError ? error.message : 'Please try again.');
    }
  };

  const submit = () => {
    if (!photoUri) {
      setFormError('Take or choose a photo of the document first.');
      return;
    }
    if (!title.trim()) {
      setFormError('Give the document a name, for example "Blood test, March".');
      return;
    }
    setFormError(null);
    save.mutate(photoUri, { onSuccess: onDone });
  };

  const requestError =
    save.error instanceof PhotoUploadError ? save.error.message : describeRequestError(save.error);

  return (
    <View className="gap-4 rounded-lg border border-border bg-surface p-4">
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          accessibilityLabel="Document photo"
          contentFit="contain"
          style={{ width: '60%', aspectRatio: PREVIEW_ASPECT_RATIO, borderRadius: radius.md }}
        />
      ) : (
        <View className="flex-row flex-wrap gap-2">
          <Button label="Take a photo" variant="secondary" onPress={() => choose('camera')} />
          <Button
            label="Choose from photos"
            variant="secondary"
            onPress={() => choose('library')}
          />
        </View>
      )}
      <TextField
        label="Name"
        value={title}
        onChangeText={setTitle}
        placeholder="Blood test, March"
        maxLength={HEALTH_PROFILE_LIMITS.NAME_MAX_LENGTH}
      />
      {formError && <FormMessage message={formError} />}
      <FormActions
        saveLabel="Save document"
        errorMessage={requestError}
        isSaving={save.isPending}
        onSave={submit}
        onCancel={onDone}
      />
    </View>
  );
}

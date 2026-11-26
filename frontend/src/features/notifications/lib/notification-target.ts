import { NOTIFICATION_KIND } from '@welcheq/shared';
import type { Href } from 'expo-router';

import type { AppNotification } from '../api/notifications.api';

/** Where tapping a notification takes you. */
export function notificationTarget(notification: AppNotification): Href {
  const params = { patientId: notification.patientId };

  switch (notification.kind) {
    case NOTIFICATION_KIND.CAREGIVER_ARRIVED:
    case NOTIFICATION_KIND.CAREGIVER_LEFT:
    case NOTIFICATION_KIND.VISIT_MISSED:
      return { pathname: '/patients/[patientId]/visits', params };
    case NOTIFICATION_KIND.VISIT_REPORT:
      return notification.entityId
        ? {
            pathname: '/patients/[patientId]/visit-report',
            params: { ...params, visitId: notification.entityId },
          }
        : { pathname: '/patients/[patientId]/visits', params };
    case NOTIFICATION_KIND.INCIDENT_REPORTED:
    case NOTIFICATION_KIND.INCIDENT_RESOLVED:
      return { pathname: '/patients/[patientId]/incidents', params };
    case NOTIFICATION_KIND.MESSAGE:
      return { pathname: '/patients/[patientId]/messages', params };
    case NOTIFICATION_KIND.CALL_MISMATCH:
    default:
      return { pathname: '/patients/[patientId]', params };
  }
}

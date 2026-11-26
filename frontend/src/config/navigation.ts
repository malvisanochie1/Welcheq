import type { Href } from 'expo-router';
import { PATIENT_MANAGER_ROLES, type UserRole } from '@welcheq/shared';
import { Bell, ChartColumn, HeartHandshake, Settings, type LucideIcon } from 'lucide-react-native';

export interface NavigationItem {
  label: string;
  href: Href;
  matchPrefix: string;
  icon: LucideIcon;
  showsUnreadCount?: boolean;
  /** Shown only to these roles; everyone sees items without a list. */
  roles?: readonly UserRole[];
}

export const PRIMARY_NAVIGATION: readonly NavigationItem[] = [
  { label: 'Loved ones', href: '/home', matchPrefix: '/home', icon: HeartHandshake },
  {
    label: 'Overview',
    href: '/dashboard',
    matchPrefix: '/dashboard',
    icon: ChartColumn,
    roles: PATIENT_MANAGER_ROLES,
  },
  {
    label: 'Notifications',
    href: '/notifications',
    matchPrefix: '/notifications',
    icon: Bell,
    showsUnreadCount: true,
  },
  { label: 'Settings', href: '/settings', matchPrefix: '/settings', icon: Settings },
];

/** Patient pages belong under "Loved ones" in the sidebar. */
export const NAVIGATION_ALIASES: Readonly<Record<string, string>> = {
  '/patients': '/home',
};

export const EMAIL_CONFIRMED_PATH = '/email-confirmed';

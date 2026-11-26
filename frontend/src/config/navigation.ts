import type { Href } from 'expo-router';
import { HeartHandshake, Settings, type LucideIcon } from 'lucide-react-native';

export interface NavigationItem {
  label: string;
  href: Href;
  matchPrefix: string;
  icon: LucideIcon;
}

export const PRIMARY_NAVIGATION: readonly NavigationItem[] = [
  { label: 'Loved ones', href: '/home', matchPrefix: '/home', icon: HeartHandshake },
  { label: 'Settings', href: '/settings', matchPrefix: '/settings', icon: Settings },
];

/** Patient pages belong under "Loved ones" in the sidebar. */
export const NAVIGATION_ALIASES: Readonly<Record<string, string>> = {
  '/patients': '/home',
};

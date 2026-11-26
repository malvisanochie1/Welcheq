import { router, usePathname } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { BRAND } from '@/config/brand';
import { NAVIGATION_ALIASES, PRIMARY_NAVIGATION } from '@/config/navigation';
import { signOut } from '@/features/auth/api/auth.api';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/use-notifications';
import { cn } from '@/lib/cn';
import { layout, palette } from '@/theme';

const ICON_SIZE = 20;

function resolveSection(pathname: string): string {
  const alias = Object.entries(NAVIGATION_ALIASES).find(([prefix]) => pathname.startsWith(prefix));
  return alias ? alias[1] : pathname;
}

export function DesktopSidebar() {
  const section = resolveSection(usePathname());
  const unread = useUnreadNotificationCount();

  return (
    <View
      accessibilityRole="navigation"
      className="justify-between border-r border-border bg-surface px-4 py-6"
      style={{ width: layout.sidebarWidth }}
    >
      <View className="gap-8">
        <Text variant="title" className="px-3 text-primary">
          {BRAND.NAME}
        </Text>
        <View className="gap-1">
          {PRIMARY_NAVIGATION.map((item) => {
            const isActive = section.startsWith(item.matchPrefix);
            const Icon = item.icon;
            return (
              <Pressable
                key={item.label}
                accessibilityRole="link"
                accessibilityState={{ selected: isActive }}
                onPress={() => router.navigate(item.href)}
                className={cn(
                  'min-h-12 flex-row items-center gap-3 rounded-md px-3',
                  isActive ? 'bg-primary-soft' : 'hover:bg-surface-muted',
                )}
              >
                <Icon size={ICON_SIZE} color={isActive ? palette.primary : palette['ink-muted']} />
                <Text
                  variant="label"
                  className={cn('flex-1 text-base', isActive && 'text-primary')}
                >
                  {item.label}
                </Text>
                {item.showsUnreadCount && unread > 0 && (
                  <View className="min-w-6 items-center rounded-full bg-danger px-2 py-0.5">
                    <Text variant="label" className="text-xs text-on-primary">
                      {unread}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={signOut}
        className="min-h-12 flex-row items-center gap-3 rounded-md px-3 hover:bg-surface-muted"
      >
        <LogOut size={ICON_SIZE} color={palette['ink-muted']} />
        <Text variant="label" className="text-base text-ink-muted">
          Sign out
        </Text>
      </Pressable>
    </View>
  );
}

import { homeCodeAt, ROTATING_CODE, secondsUntilNextHomeCode } from '@welcheq/shared';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { BRAND } from '@/config/brand';
import type { HomeDisplayConfig } from '../stores/home-display.store';

const TICK_MS = 1_000;
const CODE_GROUP = ROTATING_CODE.DIGITS / 2;

export interface HomeCodeDisplayProps {
  config: HomeDisplayConfig;
  onStop: () => void;
}

export function HomeCodeDisplay({ config, onStop }: HomeCodeDisplayProps) {
  useKeepAwake();
  const [now, setNow] = useState(() => new Date());
  const [isConfirmingStop, setIsConfirmingStop] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const code = homeCodeAt(config.secret, now);
  const secondsLeft = secondsUntilNextHomeCode(now);
  const spokenCode = code.split('').join(' ');

  return (
    <View className="flex-1 items-center justify-between bg-primary px-[6%] py-12">
      <Text variant="label" className="text-on-primary opacity-80">
        {BRAND.NAME} · {config.patientFirstName}'s home
      </Text>

      <View className="w-full items-center gap-6">
        <Text variant="body" className="text-center text-on-primary">
          Caregiver check-in code
        </Text>
        <Text
          accessibilityLabel={`Code ${spokenCode}`}
          accessibilityLiveRegion="polite"
          className="font-body-bold text-6xl tracking-widest text-on-primary"
        >
          {code.slice(0, CODE_GROUP)} {code.slice(CODE_GROUP)}
        </Text>
        <View className="h-2 w-3/4 overflow-hidden rounded-full bg-primary-pressed">
          <View
            className="h-full rounded-full bg-on-primary"
            style={{ width: `${(secondsLeft / ROTATING_CODE.PERIOD_SECONDS) * 100}%` }}
          />
        </View>
        <Text variant="caption" className="text-on-primary opacity-80">
          New code in {secondsLeft} s
        </Text>
      </View>

      {isConfirmingStop ? (
        <View className="w-full max-w-sm gap-2">
          <Text variant="caption" className="text-center text-on-primary">
            This device will stop showing codes. The family can set it up again.
          </Text>
          <Button label="Stop showing codes" variant="secondary" onPress={onStop} />
          <Button
            label="Keep showing codes"
            variant="ghost"
            onPress={() => setIsConfirmingStop(false)}
          />
        </View>
      ) : (
        <Button label="Settings" variant="ghost" onPress={() => setIsConfirmingStop(true)} />
      )}
    </View>
  );
}

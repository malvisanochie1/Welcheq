import { REVIEW_RULES } from '@welcheq/shared';
import { Star } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { palette, touchTarget } from '@/theme';

const STARS = Array.from({ length: REVIEW_RULES.MAX_RATING }, (_, index) => index + 1);
const SMALL_ICON = 16;
const LARGE_ICON = 32;

export interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
}

/** Shows a rating, or lets someone choose one when onChange is given. */
export function StarRating({ value, onChange }: StarRatingProps) {
  const size = onChange ? LARGE_ICON : SMALL_ICON;

  return (
    <View
      accessibilityRole={onChange ? 'radiogroup' : 'image'}
      accessibilityLabel={onChange ? 'Rating' : `${value.toFixed(1)} out of ${STARS.length} stars`}
      className="flex-row"
    >
      {STARS.map((star) => {
        const isFilled = star <= Math.round(value);
        const icon = (
          <Star
            size={size}
            color={palette.accent}
            fill={isFilled ? palette.accent : 'transparent'}
          />
        );
        return onChange ? (
          <Pressable
            key={star}
            accessibilityRole="radio"
            accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
            accessibilityState={{ selected: star === value }}
            onPress={() => onChange(star)}
            className="items-center justify-center"
            style={{ minWidth: touchTarget.min, minHeight: touchTarget.min }}
          >
            {icon}
          </Pressable>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}

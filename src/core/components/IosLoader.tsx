import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { colors } from '../theme';

type IosLoaderProps = {
  size?: number;
  color?: string;
};

const SPOKE_COUNT = 12;
const SPOKES = Array.from({ length: SPOKE_COUNT }, (_, i) => i);

export function IosLoader({
  size = 20,
  color = colors.textInverse,
}: IosLoaderProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {SPOKES.map((index) => {
          const angle = index * (360 / SPOKE_COUNT);
          const opacity = 0.15 + (index / (SPOKE_COUNT - 1)) * 0.85;
          return (
            <Line
              key={index}
              x1="12"
              y1="2.5"
              x2="12"
              y2="6.5"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity={opacity}
              transform={`rotate(${angle} 12 12)`}
            />
          );
        })}
      </Svg>
    </Animated.View>
  );
}

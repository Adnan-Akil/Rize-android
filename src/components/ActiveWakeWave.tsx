import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { THEME } from "../styles/theme";

export interface ActiveWakeWaveProps {
  size?: number;
}

export function ActiveWakeWave({ size = 260 }: ActiveWakeWaveProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, []);

  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }}
      >
        <Svg width={size} height={size}>
          {/* Outermost ring */}
          <Circle
            cx={center}
            cy={center}
            r={size * 0.45}
            fill="none"
            stroke="rgba(167, 235, 242, 0.2)"
            strokeWidth="1.5"
          />
          {/* Middle ring */}
          <Circle
            cx={center}
            cy={center}
            r={size * 0.35}
            fill="none"
            stroke="rgba(84, 172, 191, 0.4)"
            strokeWidth="2"
          />
          {/* Inner pulsating radar disc */}
          <Circle
            cx={center}
            cy={center}
            r={size * 0.22}
            fill="rgba(84, 172, 191, 0.15)"
            stroke={THEME.colors.cyan}
            strokeWidth="2.5"
          />
          <Circle
            cx={center}
            cy={center}
            r={size * 0.08}
            fill={THEME.colors.cyan}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});

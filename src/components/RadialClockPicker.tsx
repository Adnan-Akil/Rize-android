import React, { useRef, useState } from "react";
import { View, StyleSheet, PanResponder, GestureResponderEvent } from "react-native";
import Svg, { Circle, Line, Text as SvgText, G } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { THEME } from "../styles/theme";
import {
  coordinatesToAngle,
  angleToHour,
  angleToMinute,
  hourToAngle,
  minuteToAngle,
} from "../utils/dialTrigonometry";

export interface RadialClockPickerProps {
  value: { hours: number; minutes: number }; // 12-hour format: 1-12, 0-59
  onChange: (value: { hours: number; minutes: number }) => void;
  mode?: "hour" | "minute";
  onModeChange?: (mode: "hour" | "minute") => void;
  size?: number;
}

export function RadialClockPicker({
  value,
  onChange,
  mode = "hour",
  onModeChange,
  size = 280,
}: RadialClockPickerProps) {
  const center = size / 2;
  const radius = size * 0.38;
  const beadRadius = 18;

  const lastNotchRef = useRef<number>(mode === "hour" ? value.hours : value.minutes);

  const triggerHaptic = (newVal: number) => {
    if (newVal !== lastNotchRef.current) {
      lastNotchRef.current = newVal;
      try {
        Haptics.selectionAsync();
      } catch (e) {
        // Fallback in web/tests
      }
    }
  };

  const handleTouch = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const angle = coordinatesToAngle(locationX, locationY, center, center);

    if (mode === "hour") {
      const selectedHour = angleToHour(angle);
      triggerHaptic(selectedHour);
      onChange({ ...value, hours: selectedHour });
    } else {
      const selectedMinute = angleToMinute(angle);
      triggerHaptic(selectedMinute);
      onChange({ ...value, minutes: selectedMinute });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleTouch(evt),
      onPanResponderMove: (evt) => handleTouch(evt),
      onPanResponderRelease: () => {
        if (mode === "hour" && onModeChange) {
          // Auto advance from hour to minute
          onModeChange("minute");
        }
      },
    })
  ).current;

  // Compute pointer position
  const currentAngle = mode === "hour" ? hourToAngle(value.hours) : minuteToAngle(value.minutes);
  const angleRad = (currentAngle - 90) * (Math.PI / 180);
  const handEndX = center + radius * Math.cos(angleRad);
  const handEndY = center + radius * Math.sin(angleRad);

  // Hour numerals (1 to 12)
  const hourPositions = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1;
    const rad = (hourToAngle(h) - 90) * (Math.PI / 180);
    return {
      label: h.toString(),
      val: h,
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  });

  // Minute numerals (00, 05, 10, ... 55)
  const minutePositions = Array.from({ length: 12 }, (_, i) => {
    const m = i * 5;
    const rad = (minuteToAngle(m) - 90) * (Math.PI / 180);
    return {
      label: m.toString().padStart(2, "0"),
      val: m,
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  });

  const numerals = mode === "hour" ? hourPositions : minutePositions;

  return (
    <View style={[styles.container, { width: size, height: size }]} {...panResponder.panHandlers}>
      <Svg width={size} height={size}>
        {/* Dial Face Background */}
        <Circle
          cx={center}
          cy={center}
          r={size / 2 - 2}
          fill={THEME.colors.surface}
          stroke={THEME.colors.border}
          strokeWidth="1.5"
        />

        {/* Inner concentric ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(38, 101, 140, 0.25)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* Clock Hand Needle */}
        <Line
          x1={center}
          y1={center}
          x2={handEndX}
          y2={handEndY}
          stroke={THEME.colors.primary}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Center Pivot Point */}
        <Circle cx={center} cy={center} r={5} fill={THEME.colors.cyan} />

        {/* Pointer Bead (highlighting selected hour/minute) */}
        <Circle
          cx={handEndX}
          cy={handEndY}
          r={beadRadius}
          fill={THEME.colors.primary}
          stroke={THEME.colors.cyan}
          strokeWidth="1.5"
        />

        {/* Radial Numerals */}
        {numerals.map((num) => {
          const isSelected =
            mode === "hour" ? num.val === value.hours : num.val === value.minutes;

          return (
            <G key={num.label}>
              <SvgText
                x={num.x}
                y={num.y + 4}
                fill={isSelected ? "#011C40" : THEME.colors.text}
                fontSize={isSelected ? "14" : "13"}
                fontWeight={isSelected ? "bold" : "600"}
                textAnchor="middle"
                fontFamily={THEME.fonts.sansSemiBold}
              >
                {num.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
  },
});

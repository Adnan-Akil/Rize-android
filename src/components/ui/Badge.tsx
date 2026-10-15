import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { THEME } from "../../styles/theme";
import { Text } from "./Text";

export interface BadgeProps extends ViewProps {
  label: string;
  variant?: "cyan" | "cerulean" | "slate" | "success";
  size?: "sm" | "md";
}

export function Badge({
  label,
  variant = "cyan",
  size = "md",
  style,
  ...props
}: BadgeProps) {
  const getBadgeColors = () => {
    switch (variant) {
      case "cerulean":
        return { bg: "rgba(84, 172, 191, 0.15)", text: THEME.colors.primary, border: THEME.colors.primary };
      case "slate":
        return { bg: "rgba(38, 101, 140, 0.2)", text: THEME.colors.textMuted, border: THEME.colors.border };
      case "success":
        return { bg: "rgba(16, 185, 129, 0.15)", text: THEME.colors.success, border: THEME.colors.success };
      case "cyan":
      default:
        return { bg: "rgba(167, 235, 242, 0.15)", text: THEME.colors.cyan, border: THEME.colors.cyan };
    }
  };

  const colors = getBadgeColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          paddingVertical: size === "sm" ? 3 : 5,
          paddingHorizontal: size === "sm" ? 8 : 12,
        },
        style,
      ]}
      {...props}
    >
      <Text
        variant="caption"
        style={[
          styles.text,
          { color: colors.text, fontSize: size === "sm" ? 11 : 12 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: THEME.radii.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: THEME.fonts.sansSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

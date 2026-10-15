import React from "react";
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ActivityIndicator } from "react-native";
import { THEME } from "../../styles/theme";
import { Text } from "./Text";

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const getContainerStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.secondary;
      case "outline":
        return styles.outline;
      case "danger":
        return styles.danger;
      case "primary":
      default:
        return styles.primary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case "sm":
        return { paddingVertical: 8, paddingHorizontal: 12, borderRadius: THEME.radii.md };
      case "lg":
        return { paddingVertical: 16, paddingHorizontal: 24, borderRadius: THEME.radii.xl };
      case "md":
      default:
        return { paddingVertical: 12, paddingHorizontal: 18, borderRadius: THEME.radii.lg };
    }
  };

  const getTextColor = () => {
    if (variant === "outline") return THEME.colors.primary;
    if (variant === "danger") return "#FFFFFF";
    if (variant === "secondary") return THEME.colors.cyan;
    return "#011C40"; // Dark text on Ocean Cerulean
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={[
        styles.base,
        getContainerStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          variant={size === "sm" ? "caption" : "body"}
          style={[styles.text, { color: getTextColor() }]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: THEME.colors.primary,
  },
  secondary: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1,
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: THEME.colors.primary,
    borderWidth: 1,
  },
  danger: {
    backgroundColor: THEME.colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: THEME.fonts.sansSemiBold,
  },
});

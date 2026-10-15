import React from "react";
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from "react-native";
import { THEME } from "../../styles/theme";

export interface TextProps extends RNTextProps {
  variant?: "h1" | "h2" | "h3" | "body" | "bodySmall" | "caption" | "time";
  serif?: boolean;
  color?: string;
}

export function Text({
  style,
  variant = "body",
  serif = false,
  color,
  children,
  ...props
}: TextProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case "h1":
        return {
          fontFamily: serif ? THEME.fonts.serifSemiBold : THEME.fonts.sansBold,
          fontSize: 28,
          lineHeight: 34,
          color: color || THEME.colors.text,
        };
      case "h2":
        return {
          fontFamily: serif ? THEME.fonts.serifSemiBold : THEME.fonts.sansSemiBold,
          fontSize: 22,
          lineHeight: 28,
          color: color || THEME.colors.text,
        };
      case "h3":
        return {
          fontFamily: serif ? THEME.fonts.serif : THEME.fonts.sansMedium,
          fontSize: 18,
          lineHeight: 24,
          color: color || THEME.colors.text,
        };
      case "time":
        return {
          fontFamily: THEME.fonts.sansBold,
          fontSize: 44,
          lineHeight: 52,
          letterSpacing: -1,
          color: color || THEME.colors.cyan,
        };
      case "bodySmall":
        return {
          fontFamily: THEME.fonts.sans,
          fontSize: 14,
          lineHeight: 20,
          color: color || THEME.colors.textMuted,
        };
      case "caption":
        return {
          fontFamily: THEME.fonts.sansMedium,
          fontSize: 12,
          lineHeight: 16,
          color: color || THEME.colors.textMuted,
        };
      case "body":
      default:
        return {
          fontFamily: serif ? THEME.fonts.serif : THEME.fonts.sans,
          fontSize: 16,
          lineHeight: 22,
          color: color || THEME.colors.text,
        };
    }
  };

  return (
    <RNText style={[getVariantStyle(), style]} {...props}>
      {children}
    </RNText>
  );
}

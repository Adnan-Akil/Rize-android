import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { THEME } from "../../styles/theme";

export interface CardProps extends ViewProps {
  elevated?: boolean;
}

export function Card({ style, elevated = false, children, ...props }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.radii.lg,
    padding: 16,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
});

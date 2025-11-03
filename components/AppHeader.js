// components/AppHeader.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../styles/theme";



const styles = StyleSheet.create({
  header: {
    backgroundColor: "#fff",
    paddingTop: spacing.lg + 10,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  title: {
    fontFamily: "Courier New", // 💡 replace with any “funky” font you like
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: 1.2,
  },
  titleAccent: {
    color: colors.accent,
  },
});

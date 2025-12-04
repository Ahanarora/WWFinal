// ----------------------------------------
// components/EventSortToggle.js
// Toggle: Chronological / Reverse Chronological (dropdown)
// ----------------------------------------

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { spacing, fonts, getThemeColors } from "../styles/theme";
import { useUserData } from "../contexts/UserDataContext";

const SORT_LABELS = {
  chronological: "Oldest first",
  reverse: "Newest first",
};

export default function EventSortToggle({ sortOrder, onChange }) {
  const { themeColors, darkMode } = useUserData();
  const palette = themeColors || getThemeColors(darkMode);
  const [open, setOpen] = useState(false);
  const isChrono = sortOrder === "chronological";
  const themedStyles = styles(palette);

  return (
    <>
      <View style={themedStyles.container}>
        <TouchableOpacity
          onPress={() => setOpen(true)}
          style={themedStyles.button}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <View style={themedStyles.labelRow}>
            <Ionicons
              name="swap-vertical-outline"
              size={16}
              style={themedStyles.icon}
            />
            <Text style={themedStyles.label}>
              Sort timeline
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={themedStyles.backdrop} onPress={() => setOpen(false)}>
          <View style={themedStyles.menu}>
            {Object.entries(SORT_LABELS).map(([key, label]) => {
              const active = sortOrder === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[themedStyles.menuItem, active && themedStyles.menuItemActive]}
                  onPress={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      themedStyles.menuItemText,
                      active && themedStyles.menuItemTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = (palette) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.md,
      marginVertical: spacing.sm,
      alignItems: "flex-end",
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    icon: {
      marginRight: 6,
      color: palette.textSecondary,
    },
    label: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.textSecondary,
    },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.2)",
      justifyContent: "center",
      padding: spacing.lg,
    },
    menu: {
      backgroundColor: palette.surface,
      borderRadius: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: "hidden",
    },
    menuItem: {
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
    },
    menuItemActive: {
      backgroundColor: palette.border,
    },
    menuItemText: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: palette.textSecondary,
    },
    menuItemTextActive: {
      fontFamily: fonts.body,
      color: palette.textPrimary,
      fontWeight: "600",
    },
  });

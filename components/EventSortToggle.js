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

import { colors, spacing, fonts } from "../styles/theme";

const SORT_LABELS = {
  chronological: "Oldest first",
  reverse: "Newest first",
};

export default function EventSortToggle({ sortOrder, onChange }) {
  const [open, setOpen] = useState(false);
  const isChrono = sortOrder === "chronological";

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => setOpen(true)}
          style={styles.button}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <View style={styles.labelRow}>
            <Ionicons
              name="swap-vertical-outline"
              size={16}
              style={styles.icon}
            />
            <Text style={styles.label}>
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
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            {Object.entries(SORT_LABELS).map(([key, label]) => {
              const active = sortOrder === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.menuItem, active && styles.menuItemActive]}
                  onPress={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[styles.menuItemText, active && styles.menuItemTextActive]}
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

const styles = StyleSheet.create({
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
    color: colors.textSecondary,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  menuItemActive: {
    backgroundColor: colors.highlight,
  },
  menuItemText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  menuItemTextActive: {
    fontFamily: fonts.medium || fonts.regular,
    color: colors.textPrimary,
  },
});

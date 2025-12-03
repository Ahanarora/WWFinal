// ------------------------------------------------------------
// WWFilterPaneThemes.js
// Filter Pane for ThemesScreen
// Identical HomeScreen styling, but NO subcategories
// Props-driven: categories + sorting
// ------------------------------------------------------------

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors } from "../styles/theme";

export default function WWFilterPaneThemes({
  categories = [],
  activeCategory,
  sortMode,
  onCategoryChange,
  onSortChange,
}) {
  const palette = getThemeColors(false);
  const styles = createStyles(palette);

  const [showSortMenu, setShowSortMenu] = React.useState(false);

  return (
    <View style={styles.filterWrapper}>
      {/* ---------------------------- */}
      {/* CATEGORY ROW                */}
      {/* ---------------------------- */}
      <View style={styles.filterTopRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {categories.map((cat) => {
            const active = cat === activeCategory;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => onCategoryChange(cat)}
                style={[
                  styles.categoryPill,
                  active && styles.categoryPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort Button */}
        <TouchableOpacity
          onPress={() => setShowSortMenu(true)}
          style={styles.dropdownButton}
        >
          <Ionicons
            name="swap-vertical-outline"
            size={16}
            color={palette.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.dropdownButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {/* ---------------------------- */}
      {/* SORT MODAL                  */}
      {/* ---------------------------- */}
      <Modal
        visible={showSortMenu}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSortMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          onPress={() => setShowSortMenu(false)}
        >
          <View style={styles.modalContent}>
            {[
              { key: "relevance", label: "Relevance" },
              { key: "updated", label: "Recently Updated" },
              { key: "published", label: "Recently Published" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.modalOption}
                onPress={() => {
                  onSortChange(opt.key);
                  setShowSortMenu(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    sortMode === opt.key && styles.selectedOptionText,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ------------------------------------------------------------
// Styles — EXACT copy of HomeScreen filter UI
// ------------------------------------------------------------
const createStyles = (palette) =>
  StyleSheet.create({
    filterWrapper: {
      borderBottomWidth: 1,
      borderColor: palette.border,
      paddingVertical: 6,
      backgroundColor: palette.surface,
    },

    filterTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 0,
    },

    categoryRow: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 0,
    },

    categoryPill: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 14,
      backgroundColor: palette.surface,
    },
    categoryPillActive: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    categoryText: {
      fontSize: 13,
      color: palette.textSecondary,
    },
    categoryTextActive: {
      color: "#fff",
      fontWeight: "600",
    },

    dropdownButton: {
      paddingVertical: 4,
      backgroundColor: "transparent",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    dropdownButtonText: {
      fontSize: 13,
      color: palette.textSecondary,
      fontWeight: "400",
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "center",
      padding: 30,
    },
    modalContent: {
      backgroundColor: palette.surface,
      borderRadius: 10,
    },
    modalOption: {
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
    modalOptionText: {
      fontSize: 16,
      color: palette.textPrimary,
    },
    selectedOptionText: {
      fontWeight: "bold",
      color: palette.accent,
    },
  });

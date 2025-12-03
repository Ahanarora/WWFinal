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
          {categories.map((cat, idx) => {
            const active = cat === activeCategory;
            return (
              <React.Fragment key={cat}>
                <TouchableOpacity
                  onPress={() => onCategoryChange(cat)}
                  style={styles.categoryButton}
                >
                  {active && <View style={styles.marker} />}
                  <Text
                    style={[
                      styles.categoryText,
                      active && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
                {idx < categories.length - 1 && (
                  <View style={styles.separator} />
                )}
              </React.Fragment>
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
      <View style={styles.divider} />
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
      paddingHorizontal: 0,
      alignItems: "center",
    },

    categoryButton: {
      paddingVertical: 4,
      paddingHorizontal: 6,
      position: "relative",
    },
    categoryText: {
      fontSize: 13,
      color: palette.textSecondary,
      fontWeight: "700",
      fontStyle: "italic",
    },
    categoryTextActive: {
      color: palette.textPrimary,
    },
    marker: {
      position: "absolute",
      top: -2,
      bottom: -2,
      left: -6,
      right: -6,
      backgroundColor: palette.accent,
      opacity: 0.7,
      transform: [{ skewX: "-15deg" }],
      borderRadius: 6,
      zIndex: -1,
    },
    separator: {
      width: 1,
      height: 14,
      backgroundColor: palette.border,
      marginHorizontal: 8,
      alignSelf: "center",
      opacity: 0.5,
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
    divider: {
      height: 1,
      backgroundColor: palette.border,
      marginHorizontal: 16,
      opacity: 0.4,
    },
  });

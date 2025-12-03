// ------------------------------------------------------------
// WWFilterPaneStories.js
// Shared Filter Pane for StoriesScreen
// Identical to HomeScreen UI
// Props-driven: categories + subcategories + sorting
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

export default function WWFilterPaneStories({
  categories = [],
  subcategories = {},
  activeCategory,
  activeSubcategory,
  sortMode,
  onCategoryChange,
  onSubcategoryChange,
  onSortChange,
}) {
  const palette = getThemeColors(false);
  const styles = createStyles(palette);

  // Active subcategory list for the chosen category
  const SUBCATS =
    activeCategory !== "All" ? subcategories[activeCategory] || [] : [];

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
                  onPress={() => {
                    onCategoryChange(cat);
                    onSubcategoryChange("All");
                  }}
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

        {/* Sort button */}
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
      {/* SUBCATEGORY ROW             */}
      {/* ---------------------------- */}
      {activeCategory !== "All" && <View style={styles.divider} />}
      {activeCategory !== "All" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subcategoryRow}
        >
          {/* ALL subcategory */}
          {[{ label: "ALL", value: "All" }, ...SUBCATS.map((s) => ({ label: s, value: s }))].map(
            (sub, idx, arr) => {
              const active = activeSubcategory === sub.value;
              return (
                <React.Fragment key={sub.value}>
                  <TouchableOpacity onPress={() => onSubcategoryChange(sub.value)}>
                    <Text
                      style={[
                        styles.subcategoryText,
                        active && styles.subcategoryTextActive,
                      ]}
                    >
                      {sub.label}
                    </Text>
                  </TouchableOpacity>
                  {idx < arr.length - 1 && <View style={styles.separator} />}
                </React.Fragment>
              );
            }
          )}
        </ScrollView>
      )}

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
// Styles — IDENTICAL to HomeScreen filter UI
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

    subcategoryRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 8,
      alignItems: "center",
    },
    subcategoryText: {
      fontSize: 13,
      color: palette.textSecondary,
      fontWeight: "400",
      fontStyle: "italic",
    },
    subcategoryTextActive: {
      color: palette.textPrimary,
    },
    separator: {
      width: 1,
      height: 14,
      backgroundColor: palette.border,
      marginHorizontal: 8,
      alignSelf: "center",
      opacity: 0.5,
    },
    divider: {
      height: 1,
      backgroundColor: palette.border,
      marginHorizontal: 16,
      opacity: 0.4,
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

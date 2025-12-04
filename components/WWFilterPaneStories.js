// ------------------------------------------------------------
// WWFilterPaneStories.js
// Shared Filter Pane for StoriesScreen
// Identical to HomeScreen UI
// Props-driven: categories + subcategories + sorting
// ------------------------------------------------------------

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { getThemeColors } from "../styles/theme";

export default function WWFilterPaneStories({
  categories = [],
  subcategories = {},
  activeCategory,
  activeSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  themeColors,
}) {
  const palette = themeColors || getThemeColors(false);
  const styles = createStyles(palette);

  // Active subcategory list for the chosen category
  const SUBCATS = activeCategory !== "All" ? subcategories[activeCategory] || [] : [];

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
          {[{ label: "All", value: "All" }, ...SUBCATS.map((s) => ({ label: s, value: s }))].map(
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
      paddingHorizontal: 6,
      paddingTop: 0,
    },

    categoryRow: {
      flexDirection: "row",
      paddingHorizontal: 6,
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
      fontWeight: "625",
    },
    categoryTextActive: {
      color: palette.textPrimary,
    },
    marker: {
      position: "absolute",
      top: 2,
      bottom: 2,
      left: -4,
      right: -4,
      backgroundColor: "#FACC15",
      opacity: 0.65,
      transform: [{ skewX: "-15deg" }],
      borderRadius: 4,
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
    },
    subcategoryTextActive: {
      color: palette.textPrimary,
      fontWeight: "600",
    },
    separator: {
      width: 2,
      height: 14,
      backgroundColor: palette.border,
      marginHorizontal: 18,
      alignSelf: "center",
      opacity: 0.9,
    },
  });

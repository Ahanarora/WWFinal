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
  StyleSheet,
} from "react-native";
import { getThemeColors } from "../styles/theme";

export default function WWFilterPaneThemes({
  categories = [],
  activeCategory,
  onCategoryChange,
}) {
  const palette = getThemeColors(false);
  const styles = createStyles(palette);

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

      </View>
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
      paddingHorizontal: 16,
      paddingTop: 0,
    },

    categoryRow: {
      flexDirection: "row",
      paddingHorizontal: 18,
      alignItems: "center",
    },

    categoryButton: {
      paddingVertical: 4,
      paddingHorizontal: 16,
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
    separator: {
      width: 2,
      height: 14,
      backgroundColor: palette.border,
      marginHorizontal: 18,
      alignSelf: "center",
      opacity: 0.9,
    },

  });

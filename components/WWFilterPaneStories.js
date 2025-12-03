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
          {categories.map((cat) => {
            const active = cat === activeCategory;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => {
                  onCategoryChange(cat);
                  onSubcategoryChange("All");
                }}
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
      {activeCategory !== "All" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subcategoryRow}
        >
          {/* ALL subcategory */}
          <TouchableOpacity onPress={() => onSubcategoryChange("All")}>
            <Text
              style={[
                styles.subcategoryText,
                activeSubcategory === "All" && styles.subcategoryTextActive,
              ]}
            >
              ALL
            </Text>
          </TouchableOpacity>

          {SUBCATS.map((sub) => (
            <TouchableOpacity
              key={sub}
              onPress={() => onSubcategoryChange(sub)}
            >
              <Text
                style={[
                  styles.subcategoryText,
                  activeSubcategory === sub && styles.subcategoryTextActive,
                ]}
              >
                {sub}
              </Text>
            </TouchableOpacity>
          ))}
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
    },

    categoryPill: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 14,
      backgroundColor: palette.surface,
      marginRight: 10,      // replaces gap
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

    subcategoryRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    subcategoryText: {
      fontSize: 13,
      color: palette.textSecondary,
      marginRight: 14,     // replaces gap
    },
    subcategoryTextActive: {
      color: palette.accent,
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

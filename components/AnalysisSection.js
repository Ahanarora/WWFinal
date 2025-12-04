// ----------------------------------------
// components/AnalysisSection.js  (pure JS)
// ----------------------------------------
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
} from "react-native";
import RenderWithContext from "./RenderWithContext";
import { getThemeColors } from "../styles/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AnalysisSection({
  analysis,
  contexts = [],
  navigation,
  themeColors,
}) {
  const [openSections, setOpenSections] = useState({});
  const [openSub, setOpenSub] = useState({});
  const palette = themeColors || getThemeColors(false);
  const styles = useMemo(() => createStyles(palette), [palette]);

  const toggleSection = (key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSections((p) => ({ ...p, [key]: !p[key] }));
  };

  const toggleSub = (key, idx) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSub((p) => ({ ...p, [`${key}-${idx}`]: !p[`${key}-${idx}`] }));
  };

  const sections = [
    { key: "stakeholders", label: "Stakeholders" },
    { key: "faqs", label: "FAQs" },
    { key: "future", label: "Future Questions" },
  ];

  if (!analysis) return null;

  return (
    <View style={styles.container}>
      {sections.map(({ key, label }) => {
        const list = analysis[key] || [];
        return (
          <View key={key} style={styles.section}>
            <TouchableOpacity onPress={() => toggleSection(key)}>
              <Text style={styles.sectionTitle}>
                {label} {openSections[key] ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>

            {openSections[key] && (
              <View style={styles.subList}>
                {list.length === 0 ? (
                  <Text style={styles.emptyText}>No {label.toLowerCase()} yet.</Text>
                ) : (
                  list.map((item, idx) => (
                    <View key={idx} style={styles.itemBlock}>
                      <TouchableOpacity onPress={() => toggleSub(key, idx)}>
                        <View style={styles.itemTitleRow}>
                          <RenderWithContext
                            text={key === "stakeholders" ? item.name : item.question}
                            contexts={contexts}
                            navigation={navigation}
                            textStyle={styles.itemTitle}
                            themeColors={palette}
                            textStyle={styles.itemTitle}
                          />
                          <Text style={styles.itemArrow}>
                            {openSub[`${key}-${idx}`] ? "▲" : "▼"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {openSub[`${key}-${idx}`] && (
                        <RenderWithContext
                          text={key === "stakeholders" ? item.detail : item.answer}
                          contexts={contexts}
                          navigation={navigation}
                          themeColors={palette}
                          textStyle={styles.itemDetail}
                        />
                      )}
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (palette) =>
  StyleSheet.create({
    container: { marginTop: 12 },
    section: {
      backgroundColor: palette.surface,
      borderRadius: 10,
      marginBottom: 10,
      padding: 10,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
      borderWidth: 1,
      borderColor: palette.border,
    },
    sectionTitle: {
      fontWeight: "bold",
      fontSize: 16,
      color: palette.textPrimary,
    },
    subList: { marginTop: 8 },
    emptyText: { color: palette.textSecondary, fontStyle: "italic", fontSize: 13 },
    itemBlock: {
      backgroundColor: palette.surface,
      borderRadius: 8,
      padding: 8,
      marginTop: 6,
      borderWidth: 1,
      borderColor: palette.border,
    },
    itemTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    itemTitle: { fontWeight: "600", color: palette.textPrimary, flex: 1 },
    itemArrow: { color: palette.textSecondary },
    itemDetail: { marginTop: 4, color: palette.textSecondary, fontSize: 13 },
  });

// ----------------------------------------
// components/AnalysisSection.js  (pure JS)
// ----------------------------------------
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AnalysisSection({ analysis }) {
  const [openSections, setOpenSections] = useState({});
  const [openSub, setOpenSub] = useState({});

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
                        <Text style={styles.itemTitle}>
                          {key === "stakeholders" ? item.name : item.question}{" "}
                          {openSub[`${key}-${idx}`] ? "▲" : "▼"}
                        </Text>
                      </TouchableOpacity>
                      {openSub[`${key}-${idx}`] && (
                        <Text style={styles.itemDetail}>
                          {key === "stakeholders" ? item.detail : item.answer}
                        </Text>
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

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: { fontWeight: "bold", fontSize: 16, color: "#1e3a8a" },
  subList: { marginTop: 8 },
  emptyText: { color: "#6b7280", fontStyle: "italic", fontSize: 13 },
  itemBlock: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  itemTitle: { fontWeight: "600", color: "#1f2937" },
  itemDetail: { marginTop: 4, color: "#374151", fontSize: 13 },
});

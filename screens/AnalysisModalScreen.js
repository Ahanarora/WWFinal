// ----------------------------------------
// screens/AnalysisModalScreen.js
// Full-screen analysis list for one section
// ----------------------------------------
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { normalizeAnalysis } from "../utils/normalizeAnalysis";
import RenderWithContext from "../components/RenderWithContext";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function AccordionItem({ label, detail, contexts, navigation }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => !prev);
  };

  return (
    <View style={styles.itemBlock}>
      <TouchableOpacity onPress={toggle}>
        <View style={styles.itemTitleRow}>
          <RenderWithContext
            text={label}
            contexts={contexts}
            navigation={navigation}
            textStyle={styles.itemTitle}
          />
          <Text style={styles.itemArrow}>{open ? "▲" : "▼"}</Text>
        </View>
      </TouchableOpacity>
      {open && !!detail && (
        <RenderWithContext
          text={detail}
          contexts={contexts}
          navigation={navigation}
          textStyle={styles.itemDetail}
        />
      )}
    </View>
  );
}

export default function AnalysisModalScreen({ route, navigation }) {
  const { type, analysis: rawAnalysis, contexts: routeContexts = [] } =
    route.params || {};
  const analysis = normalizeAnalysis(rawAnalysis || {}) || {
    stakeholders: [],
    faqs: [],
    future: [],
  };

  const titleMap = {
    stakeholders: "Stakeholders",
    faqs: "FAQs",
    future: "Future Questions",
  };

  const key = type === "stakeholders" || type === "faqs" || type === "future"
    ? type
    : "faqs";

  const sectionTitle = titleMap[key] || "Analysis";
  const items = analysis[key] || [];

  const combinedContexts =
    routeContexts?.length > 0
      ? routeContexts
      : analysis?.contexts || [];

  const hasContent = Array.isArray(items) && items.length > 0;

  return (
    <View style={styles.container}>
      {/* Header: title centered, X on right */}
      <View style={styles.header}>
        <View style={styles.headerSide} /> 
        <Text style={styles.headerTitle}>{sectionTitle}</Text>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={26} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
      >
        {hasContent ? (
          items.map((item, idx) => {
            const label =
              key === "stakeholders"
                ? item.name || "Stakeholder"
                : item.question || "Question";

            const detail =
              key === "stakeholders"
                ? item.detail || ""
                : item.answer || "";

            return (
              <AccordionItem
                key={idx}
                label={label}
                detail={detail}
                contexts={combinedContexts}
                navigation={navigation}
              />
            );
          })
        ) : (
          <Text style={styles.emptyText}>
            No {sectionTitle.toLowerCase()} added yet.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
    justifyContent: "space-between",
  },
  headerSide: {
    width: 30,
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
  itemBlock: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  itemArrow: {
    fontSize: 14,
    color: "#4B5563",
  },
  itemDetail: {
    marginTop: 6,
    color: "#374151",
    fontSize: 13,
  },
});

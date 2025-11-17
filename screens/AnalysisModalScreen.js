// ----------------------------------------
// screens/AnalysisModalScreen.js
// ----------------------------------------
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AnalysisSection from "../components/AnalysisSection";

export default function AnalysisModalScreen({ route, navigation }) {
  const { type, story } = route.params || {};

  const analysis = story?.analysis || {};

  // Correct display titles
  const titleMap = {
    faqs: "FAQs",
    stakeholders: "Stakeholders",
    future: "Future Questions",
  };

  // Try both `futureQuestions` and `future` for safety
  const sectionMap = {
    faqs: analysis.faqs ?? [],
    stakeholders: analysis.stakeholders ?? [],
    future: analysis.futureQuestions ?? analysis.future ?? [],
  };

  const data = sectionMap[type] ?? [];

  const hasContent =
    (Array.isArray(data) && data.length > 0) ||
    (typeof data === "string" && data.trim().length > 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{titleMap[type] || "Analysis"}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {hasContent ? (
          <AnalysisSection data={data} />
        ) : (
          <Text style={styles.emptyText}>
            No {titleMap[type]?.toLowerCase() || "analysis"} added for this
            story yet.
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
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
});

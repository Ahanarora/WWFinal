// ----------------------------------------
// screens/StoryScreen.js
// ----------------------------------------
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import Slider from "@react-native-community/slider";
import { colors, fonts, spacing } from "../styles/theme";
import AnalysisSection from "../components/AnalysisSection";
import SourceLinks from "../components/SourceLinks";
import RenderWithContext from "../components/RenderWithContext";
import { renderLinkedText } from "../utils/renderLinkedText";



export default function StoryScreen({ route, navigation }) {
  const { story } = route.params || {};
  if (!story)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>⚠️ No story found.</Text>
      </View>
    );

  const timeline = Array.isArray(story.timeline) ? story.timeline : [];
  const [depth, setDepth] = useState(3); // 1=Essential, 2=Balanced, 3=Complete

  const filteredTimeline = timeline.filter((e) => {
    if (depth === 1) return e.significance === 3;
    if (depth === 2) return e.significance >= 2;
    return true;
  });

  return (
  <ScrollView style={styles.container}>
    {/* Cover */}
    {story.imageUrl && (
      <Image source={{ uri: story.imageUrl }} style={styles.coverImage} />
    )}

    {/* Metadata */}
    <Text style={styles.title}>{story.title || "Untitled Story"}</Text>
    <Text style={styles.category}>{story.category || "Uncategorized"}</Text>

    {/* Overview */}
    <View style={{ marginVertical: 10 }}>
      {renderLinkedText(story.overview, navigation)}
    </View>


      {/* 🧭 Depth Toggle */}
      {timeline.length > 0 && (
        <View style={styles.sliderBox}>
          <Text style={styles.sliderLabel}>Essential</Text>
          <Slider
            style={{ flex: 1, height: 40 }}
            minimumValue={1}
            maximumValue={3}
            step={1}
            value={depth}
            onValueChange={(v) => setDepth(v)}
            minimumTrackTintColor="#2563EB"
            maximumTrackTintColor="#D1D5DB"
            thumbTintColor="#2563EB"
          />
          <Text style={styles.sliderLabel}>Complete</Text>
        </View>
      )}

      {/* TIMELINE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {filteredTimeline.length === 0 ? (
          <Text style={styles.empty}>No events for this depth.</Text>
        ) : (
          filteredTimeline.map((e, i) => (
            <View key={i} style={styles.eventBlock}>
              {/* Event Row */}
              <View style={styles.eventRow}>
                {e.imageUrl ? (
                  <Image source={{ uri: e.imageUrl }} style={styles.thumb} />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Text style={{ fontSize: 16 }}>📰</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventDate}>{e.date}</Text>
                  <Text style={styles.eventTitle}>{e.event}</Text>
                  <RenderWithContext text={e.description} contexts={e.contexts || []} />

                </View>
              </View>

              {/* Event-specific coverage links */}
              {Array.isArray(e.sources) && e.sources.length > 0 && (
                <View style={styles.eventSources}>
                  <SourceLinks sources={e.sources} />
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* 🧠 Analysis */}
      {story.analysis && Object.keys(story.analysis || {}).length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionTitle}>Analysis</Text>
          <AnalysisSection analysis={story.analysis} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "red" },
  coverImage: {
    width: "100%",
    height: 240,
    borderRadius: 4,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  category: {
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  overview: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  sliderBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  sliderLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    width: 60,
    textAlign: "center",
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingBottom: 4,
  },
  empty: { fontFamily: fonts.body, color: "#777" },
  eventBlock: {
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingBottom: spacing.sm,
  },
  eventRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: spacing.sm,
  },
  thumb: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  thumbPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  eventDate: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#777",
  },
  eventTitle: {
fontFamily: fonts.heading,
fontSize: 16,
color: colors.textPrimary,
paddingBottom: 4,
fontWeight: "400",
},
eventDesc: {
fontFamily: fonts.body,
fontSize: 14,
paddingBottom: 4,
color: colors.textSecondary,
},
  eventSources: {
marginTop: 4,
marginBottom: spacing.sm,
paddingLeft: 2,
}
});

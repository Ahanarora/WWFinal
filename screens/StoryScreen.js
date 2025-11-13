// ----------------------------------------
// screens/StoryScreen.js
// (RESTORED ORIGINAL WORKING VERSION)
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
  const { story, index, allStories } = route.params || {};

  // Endless scroll state
  const [feed, setFeed] = useState([story]);
  const [currentIndex, setCurrentIndex] = useState(index);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadNextStory = () => {
  if (isLoadingMore) return;
  if (currentIndex >= allStories.length - 1) return;

  setIsLoadingMore(true);

  const nextIndex = currentIndex + 1;
  const nextStory = allStories[nextIndex];

  // Avoid duplicates
  if (feed.some((s) => s.id === nextStory.id)) {
    setIsLoadingMore(false);
    return;
  }

  // Append next story to feed
  setFeed((prev) => [...prev, nextStory]);
  setCurrentIndex(nextIndex);
  setIsLoadingMore(false);
};


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

const renderStoryBlock = (item) => (
  <View key={item.id} style={{ marginBottom: 50 }}>
    {/* COVER */}
    {item.imageUrl && (
      <Image source={{ uri: item.imageUrl }} style={styles.coverImage} />
    )}

    {/* TITLE */}
    <Text style={styles.title}>{item.title || "Untitled Story"}</Text>
    <Text style={styles.category}>{item.category || "Uncategorized"}</Text>

    {/* OVERVIEW */}
    <View style={{ marginVertical: 10 }}>
      {renderLinkedText(item.overview, navigation)}
    </View>

    {/* DEPTH SLIDER ONLY FOR FIRST STORY */}
    {feed[0].id === item.id && item.timeline?.length > 0 && (
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

      {item.timeline?.map((e, i) => (
        <View key={i} style={styles.eventBlock}>
          <View style={styles.eventRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventDate}>{e.date}</Text>
              <Text style={styles.eventTitle}>{e.event}</Text>
              <RenderWithContext
                text={e.description}
                contexts={e.contexts || []}
              />
            </View>
          </View>

          {e.sources?.length > 0 && (
            <View style={styles.eventSources}>
              <SourceLinks sources={e.sources} />
            </View>
          )}
        </View>
      ))}
    </View>

    {/* ANALYSIS */}
    {item.analysis && Object.keys(item.analysis).length > 0 && (
      <View style={{ marginTop: 16 }}>
        <Text style={styles.sectionTitle}>Analysis</Text>
        <AnalysisSection analysis={item.analysis} />
      </View>
    )}
  </View>
);

  return (
  <ScrollView
    style={styles.container}
    onScroll={({ nativeEvent }) => {
      const paddingToBottom = 300; 
      if (
        nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >=
        nativeEvent.contentSize.height - paddingToBottom
      ) {
        loadNextStory();
      }
    }}
    scrollEventThrottle={250}
  >
    {feed.map((s) => renderStoryBlock(s))}
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

  eventSources: {
    marginTop: 4,
    marginBottom: spacing.sm,
    paddingLeft: 2,
  },
});

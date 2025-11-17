// ----------------------------------------
// screens/ThemeScreen.js
// ----------------------------------------
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import Slider from "@react-native-community/slider";
import { colors, fonts, spacing } from "../styles/theme";
import AnalysisSection from "../components/AnalysisSection";
import SourceLinks from "../components/SourceLinks";
import RenderWithContext from "../components/RenderWithContext";
import { renderLinkedText } from "../utils/renderLinkedText";
import { formatUpdatedAt } from "../utils/formatTime";

export default function ThemeScreen({ route, navigation }) {
  const { theme, index, allThemes } = route.params || {};

  const [feed, setFeed] = useState([theme]);
  const [currentIndex, setCurrentIndex] = useState(index);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [depth, setDepth] = useState(3);

  if (!theme)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>⚠️ No theme found.</Text>
      </View>
    );

  const loadNextTheme = () => {
    if (isLoadingMore) return;
    if (currentIndex >= allThemes.length - 1) return;

    setIsLoadingMore(true);

    const nextIndex = currentIndex + 1;
    const nextTheme = allThemes[nextIndex];

    if (feed.some((t) => t.id === nextTheme.id)) {
      setIsLoadingMore(false);
      return;
    }

    setFeed((prev) => [...prev, nextTheme]);
    setCurrentIndex(nextIndex);
    setIsLoadingMore(false);
  };

  const renderThemeBlock = (item, isFirst) => {
    const timeline = Array.isArray(item.timeline) ? item.timeline : [];

    const filteredTimeline = timeline.filter((e) => {
      if (depth === 1) return e.significance === 3;
      if (depth === 2) return e.significance >= 2;
      return true;
    });

    return (
      <View key={item.id} style={{ marginBottom: 50 }}>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.coverImage} />
        )}

        <Text style={styles.title}>{item.title || "Untitled Theme"}</Text>
        <Text style={styles.updated}>{formatUpdatedAt(item.updatedAt)}</Text>

        <Text style={styles.category}>{item.category || "Uncategorized"}</Text>

        <View style={{ marginVertical: 10 }}>
          {renderLinkedText(item.overview, navigation)}
        </View>

        {!item.disableDepthToggle && isFirst && timeline.length > 0 && (
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chronology of Events</Text>

          {filteredTimeline.length === 0 ? (
            <Text style={styles.empty}>No events for this depth.</Text>
          ) : (
            filteredTimeline.map((e, i) => (
              <View key={i} style={styles.eventBlock}>
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
                    <RenderWithContext
                      text={e.description}
                      contexts={e.contexts || []}
                      navigation={navigation}
                    />
                  </View>
                </View>

                {Array.isArray(e.sources) && e.sources.length > 0 && (
                  <View style={styles.eventSources}>
                    <SourceLinks sources={e.sources} />
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {item.analysis && Object.keys(item.analysis || {}).length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitle}>Analysis</Text>
            <AnalysisSection analysis={item.analysis} />
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      onScroll={({ nativeEvent }) => {
        const paddingToBottom = 300;
        if (
          nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >=
          nativeEvent.contentSize.height - paddingToBottom
        ) {
          loadNextTheme();
        }
      }}
      scrollEventThrottle={250}
    >
      {feed.map((t, i) => renderThemeBlock(t, i === 0))}
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
    fontWeight: "400",
  },
  eventSources: {
    marginTop: 4,
    marginBottom: spacing.sm,
    paddingLeft: 2,
  },
  updated: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "#6B7280",
    marginBottom: spacing.md,
  },
});

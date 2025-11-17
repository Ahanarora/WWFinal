// ----------------------------------------
// screens/StoryScreen.js
// (RESTORED ORIGINAL + Analysis buttons + PHASES + Event Reader phases)
// ----------------------------------------

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import Slider from "@react-native-community/slider";
import { colors, fonts, spacing } from "../styles/theme";
import SourceLinks from "../components/SourceLinks";
import RenderWithContext from "../components/RenderWithContext";
import { renderLinkedText } from "../utils/renderLinkedText";
import { formatUpdatedAt, formatDateDDMMYYYY } from "../utils/formatTime";
import { normalizeAnalysis } from "../utils/normalizeAnalysis";

const PHASE_PALETTE = ["#2563EB", "#DC2626", "#059669", "#D97706", "#6D28D9"];
const SKY_BLUE = "#38BDF8";

export default function StoryScreen({ route, navigation }) {
  const { story, index, allStories } = route.params || {};

  // Endless scroll state
  const [feed, setFeed] = useState(story ? [story] : []);
  const [currentIndex, setCurrentIndex] = useState(index ?? 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Depth slider
  const [depth, setDepth] = useState(3);

  if (!story)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>⚠️ No story found.</Text>
      </View>
    );

  const primaryAnalysis = normalizeAnalysis(story.analysis);

  const loadNextStory = () => {
    if (isLoadingMore) return;
    if (!Array.isArray(allStories) || currentIndex >= allStories.length - 1)
      return;

    setIsLoadingMore(true);

    const nextIndex = currentIndex + 1;
    const nextStory = allStories[nextIndex];

    if (!nextStory) {
      setIsLoadingMore(false);
      return;
    }

    // Avoid duplicates
    if (feed.some((s) => s.id === nextStory.id)) {
      setIsLoadingMore(false);
      return;
    }

    setFeed((prev) => [...prev, nextStory]);
    setCurrentIndex(nextIndex);
    setIsLoadingMore(false);
  };

  const hasAnyAnalysis =
    primaryAnalysis &&
    ((primaryAnalysis.stakeholders?.length || 0) +
      (primaryAnalysis.faqs?.length || 0) +
      (primaryAnalysis.future?.length || 0) >
      0);

  // ---------------------------------------------------------
  // RENDER SINGLE STORY BLOCK (WITH PHASE HEADERS)
  // ---------------------------------------------------------
  const renderStoryBlock = (item) => {
    const rawTimeline = Array.isArray(item.timeline) ? item.timeline : [];

    // Add original index to each event
    const indexedTimeline = rawTimeline.map((evt, originalIndex) => ({
      ...evt,
      _originalIndex: originalIndex,
    }));

    // Depth filtering
    const filteredTimeline = indexedTimeline.filter((e) => {
      if (depth === 1) return e.significance === 3;
      if (depth === 2) return e.significance >= 2;
      return true;
    });

    // Phases from CMS
    const rawPhases = Array.isArray(item.phases) ? item.phases : [];
    const phasesWithAccent = rawPhases.map((phase, idx) => ({
      ...phase,
      accentColor:
        phase?.accentColor ||
        phase?.color ||
        PHASE_PALETTE[idx % PHASE_PALETTE.length],
    }));
    const phaseLookup = phasesWithAccent.reduce((acc, phase) => {
      if (typeof phase?.startIndex === "number") {
        acc[phase.startIndex] = phase;
      }
      return acc;
    }, {});

    // Helper: check if this event triggers a phase header
    const getPhaseForEvent = (event) => {
      if (!phasesWithAccent.length) return null;
      return phaseLookup[event._originalIndex] || null;
    };

    // For EventReaderModal: build enhanced timeline with phase titles
    const timelineForModal = filteredTimeline.map((evt) => {
      const phase = getPhaseForEvent(evt);
      return {
        ...evt,
        phaseTitle: phase?.title ?? null,
      };
    });

    return (
      <View key={item.id} style={{ marginBottom: 50 }}>
        {/* COVER */}
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.coverImage} />
        )}

        {/* TITLE */}
        <Text style={styles.title}>{item.title || "Untitled Story"}</Text>
        <Text style={styles.updated}>{formatUpdatedAt(item.updatedAt)}</Text>
        <Text style={styles.category}>{item.category || "Uncategorized"}</Text>

        {/* OVERVIEW */}
        {item.overview ? (
          <View style={styles.overviewBlock}>
            {renderLinkedText(item.overview, navigation)}
          </View>
        ) : null}

        {/* ANALYSIS BUTTONS */}
        {item.id === story.id && hasAnyAnalysis && (
          <View style={styles.analysisButtonsRow}>
            {primaryAnalysis.stakeholders?.length > 0 && (
              <TouchableOpacity
                style={styles.analysisButton}
                onPress={() =>
                  navigation.push("AnalysisModal", {
                    type: "stakeholders",
                    analysis: primaryAnalysis,
                  })
                }
              >
                <Text style={styles.analysisButtonText}>Stakeholders</Text>
              </TouchableOpacity>
            )}

            {primaryAnalysis.faqs?.length > 0 && (
              <TouchableOpacity
                style={styles.analysisButton}
                onPress={() =>
                  navigation.push("AnalysisModal", {
                    type: "faqs",
                    analysis: primaryAnalysis,
                  })
                }
              >
                <Text style={styles.analysisButtonText}>FAQs</Text>
              </TouchableOpacity>
            )}

            {primaryAnalysis.future?.length > 0 && (
              <TouchableOpacity
                style={styles.analysisButton}
                onPress={() =>
                  navigation.push("AnalysisModal", {
                    type: "future",
                    analysis: primaryAnalysis,
                  })
                }
              >
                <Text style={styles.analysisButtonText}>Future Qs</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* DEPTH SLIDER */}
        {feed[0].id === item.id && filteredTimeline.length > 0 && (
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

        {/* TIMELINE WITH PHASE HEADERS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>

          {filteredTimeline.map((e, i) => {
            const phase = getPhaseForEvent(e);

            return (
              <View key={e._originalIndex ?? i} style={styles.eventBlock}>
                {/* PHASE HEADER */}
                {phase && (
                  <View
                    style={[
                      styles.phaseHeader,
                      { borderLeftColor: phase.accentColor },
                    ]}
                  >
                    <Text style={styles.phaseTitle}>{phase.title}</Text>
                    {phase.description ? (
                      <Text style={styles.phaseSubtitle}>
                        {phase.description}
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* EVENT TAP → EventReaderModal */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate("EventReader", {
                      events: timelineForModal,
                      startIndex: i,
                      headerTitle: item.title || "Story",
                    })
                  }
                >
                  <View style={styles.eventCard}>
                    {e.imageUrl || e.image || e.thumbnail ? (
                      <Image
                        source={{
                          uri: e.imageUrl || e.image || e.thumbnail,
                        }}
                        style={styles.eventImage}
                      />
                    ) : (
                      <View style={styles.eventImagePlaceholder}>
                        <Text style={styles.eventImageEmoji}>🗞️</Text>
                      </View>
                    )}
                    <View style={styles.eventContent}>
                      <Text style={styles.eventDate}>
                        {formatDateDDMMYYYY(e.date)}
                      </Text>
                      <Text style={styles.eventTitle}>{e.event}</Text>
                      <RenderWithContext
                        text={e.description}
                        contexts={e.contexts || []}
                        navigation={navigation}
                      />
                      {Array.isArray(e.sources) && e.sources.length > 0 && (
                        <View style={styles.eventSources}>
                          <SourceLinks sources={e.sources} />
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      onScroll={({ nativeEvent }) => {
        const paddingToBottom = 300;
        if (
          nativeEvent.layoutMeasurement.height +
            nativeEvent.contentOffset.y >=
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

// ----------------------------------------
// STYLES
// ----------------------------------------
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
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },

  updated: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "#6B7280",
    marginBottom: spacing.md,
  },

  // ANALYSIS BUTTONS
  analysisButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  analysisButton: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderWidth: 1,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  analysisButtonText: {
    color: "#2563EB",
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },

  // SLIDER
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

  // TIMELINE
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingBottom: 4,
  },

  // PHASE HEADER
  phaseHeader: {
    marginBottom: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  phaseTitle: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: "#111827",
    textAlign: "center",
  },
  phaseSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  overviewBlock: {
    marginBottom: spacing.lg,
  },

  eventBlock: {
    marginBottom: spacing.lg,
  },

  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    gap: spacing.sm,
  },
  eventImage: {
    width: "100%",
    height: 190,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },
  eventImagePlaceholder: {
    width: "100%",
    height: 190,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  eventImageEmoji: {
    fontSize: 26,
  },
  eventContent: {
    gap: 6,
  },

  eventDate: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: SKY_BLUE,
    fontWeight: "700",
    marginBottom: 4,
  },

  eventTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.textPrimary,
    paddingBottom: 4,
    fontWeight: "400",
  },

  eventSources: {
    marginTop: spacing.sm,
  },
});

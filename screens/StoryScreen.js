// ----------------------------------------
// screens/StoryScreen.js
// (RESTORED ORIGINAL + Analysis buttons + PHASES + Event Reader phases)
// ----------------------------------------

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
  Modal,
} from "react-native";
import Slider from "@react-native-community/slider";
import { colors, fonts, spacing } from "../styles/theme";
import SourceLinks from "../components/SourceLinks";
import RenderWithContext from "../components/RenderWithContext";
import {
  formatUpdatedAt,
  formatDateLongOrdinal,
} from "../utils/formatTime";
import { normalizeAnalysis } from "../utils/normalizeAnalysis";
import CommentsSection from "../components/CommentsSection";
import { useUserData } from "../contexts/UserDataContext";
import { Ionicons } from "@expo/vector-icons";

const PHASE_PALETTE = ["#2563EB", "#DC2626", "#059669", "#D97706", "#6D28D9"];
const SKY_BLUE = "#2563EB";

function getFactCheckRgb(score) {
  if (score >= 85) return { bg: "#BBF7D0", text: "#166534" }; // green
  if (score >= 70) return { bg: "#FEF9C3", text: "#854D0E" }; // yellow
  if (score >= 50) return { bg: "#FFEDD5", text: "#9A3412" }; // orange
  return { bg: "#FEE2E2", text: "#991B1B" }; // red
}

export default function StoryScreen({ route, navigation }) {
  const { story, index, allStories } = route.params || {};

  // Endless scroll state
  const [feed, setFeed] = useState(story ? [story] : []);
  const [currentIndex, setCurrentIndex] = useState(index ?? 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Depth slider
  const [depth, setDepth] = useState(1);
  const {
    user,
    favorites,
    toggleFavorite,
    recordVisit,
  } = useUserData();
  const [factCheckModal, setFactCheckModal] = useState({
    visible: false,
    factCheck: null,
  });
  const isFavoriteStory = (id) => favorites?.stories?.includes(id);
  const handleFavorite = (item) => {
    if (!user) {
      alert("Sign in to save stories.");
      return;
    }
    toggleFavorite("stories", item.id, {
      ...item,
      _kind: "story",
    });
  };

  if (!story)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>⚠️ No story found.</Text>
      </View>
    );

  const primaryAnalysis = normalizeAnalysis(story.analysis);
  useEffect(() => {
    if (story?.id) {
      recordVisit("stories", story.id);
    }
  }, [story?.id, recordVisit]);
  const primaryContexts = [
    ...(story.contexts || []),
    ...(primaryAnalysis?.contexts || []),
  ];

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
    const analysisForItem =
      item.id === story.id ? primaryAnalysis : normalizeAnalysis(item.analysis);
    const combinedContexts = [
      ...(item.contexts || []),
      ...(analysisForItem?.contexts || []),
    ];

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
    const timelineLength = indexedTimeline.length;
    const phasesWithAccent = rawPhases.map((phase, idx) => {
      const accentColor =
        phase?.accentColor ||
        phase?.color ||
        PHASE_PALETTE[idx % PHASE_PALETTE.length];

      const nextStart = rawPhases[idx + 1]?.startIndex;
      const fallbackEnd =
        typeof nextStart === "number" ? nextStart - 1 : timelineLength - 1;
      const providedEnd =
        typeof phase?.endIndex === "number" ? phase.endIndex : undefined;

      const safeStart = Math.max(0, phase?.startIndex ?? 0);
      const safeEnd = Math.max(
        safeStart,
        Math.min(timelineLength - 1, providedEnd ?? fallbackEnd ?? safeStart)
      );

      return {
        ...phase,
        accentColor,
        startIndex: safeStart,
        endIndex: safeEnd,
      };
    });

    const phaseStartLookup = phasesWithAccent.reduce((acc, phase) => {
      if (typeof phase?.startIndex === "number") {
        acc[phase.startIndex] = phase;
      }
      return acc;
    }, {});

    const phaseRangeLookup = phasesWithAccent.reduce((acc, phase) => {
      if (
        typeof phase?.startIndex === "number" &&
        typeof phase?.endIndex === "number"
      ) {
        for (let idx = phase.startIndex; idx <= phase.endIndex; idx += 1) {
          acc[idx] = phase;
        }
      }
      return acc;
    }, {});

    const getPhaseForEventStart = (event) => {
      if (!phasesWithAccent.length) return null;
      return phaseStartLookup[event._originalIndex] || null;
    };

    const timelineForModal = filteredTimeline.map((evt) => {
      const phase = getPhaseForEventStart(evt);
      return {
        ...evt,
        phaseTitle: phase?.title ?? null,
      };
    });

    return (
      <View key={item.id} style={{ marginBottom: 0 }}>
        {/* COVER */}
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.coverImage} />
        )}

        {/* TITLE */}
        <View style={styles.storyHeaderRow}>
          <Text style={styles.title}>{item.title || "Untitled Story"}</Text>
          <TouchableOpacity onPress={() => handleFavorite(item)}>
            <Ionicons
              name={isFavoriteStory(item.id) ? "bookmark" : "bookmark-outline"}
              size={22}
              color={isFavoriteStory(item.id) ? "#2563EB" : colors.muted}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.updated}>{formatUpdatedAt(item.updatedAt)}</Text>
        <Text style={styles.category}>{item.category || "Uncategorized"}</Text>

        {/* OVERVIEW */}
        {item.overview ? (
          <View style={styles.overviewBlock}>
            <RenderWithContext
              text={item.overview}
              contexts={combinedContexts}
              navigation={navigation}
            />
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
                    contexts: primaryContexts,
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
                    contexts: primaryContexts,
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
                    contexts: primaryContexts,
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

        {/* TIMELINE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>

          {filteredTimeline.map((e, i) => {
            const startingPhase = getPhaseForEventStart(e);
            const activePhase = phaseRangeLookup[e._originalIndex];
            const isPhaseEnd =
              activePhase && activePhase.endIndex === e._originalIndex;
            const hasFactCheck =
              !!e.factCheck &&
              typeof e.factCheck.confidenceScore === "number" &&
              !Number.isNaN(e.factCheck.confidenceScore);
            const factCheckColors = hasFactCheck
              ? getFactCheckRgb(e.factCheck.confidenceScore)
              : null;

            return (
              <View key={e._originalIndex ?? i} style={styles.eventBlock}>
                {/* PHASE HEADER */}
                {startingPhase && (
                  <View
                    style={[
                      styles.phaseHeader,
                      { borderLeftColor: startingPhase.accentColor },
                    ]}
                  >
                    <Text style={styles.phaseTitle}>{startingPhase.title}</Text>
                    {startingPhase.description ? (
                      <Text style={styles.phaseSubtitle}>
                        {startingPhase.description}
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* EVENT CARD */}
                <Pressable
                  onPress={() =>
                    navigation.navigate("EventReader", {
                      events: timelineForModal,
                      startIndex: i,
                      headerTitle: item.title || "Story",
                    })
                  }
                  android_disableSound={true}
                >
                  <View
                    style={[
                      styles.eventCard,
                      activePhase && {
                        borderLeftWidth: 3,
                        borderLeftColor: activePhase.accentColor,
                        paddingLeft: spacing.md - 3,
                      },
                    ]}
                  >
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
                        {formatDateLongOrdinal(e.date)}
                      </Text>

                      <Text style={styles.eventTitle}>{e.event}</Text>

                      <RenderWithContext
                        text={e.description}
                        contexts={e.contexts || []}
                        navigation={navigation}
                      />

                      {hasFactCheck && (
                        <View style={styles.factCheckContainer}>
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() =>
                              setFactCheckModal({
                                visible: true,
                                factCheck: e.factCheck,
                              })
                            }
                          >
                            <Text
                              style={[
                                styles.factCheckBadge,
                                {
                                  backgroundColor: factCheckColors.bg,
                                  color: factCheckColors.text,
                                },
                              ]}
                            >
                              {e.factCheck.confidenceScore}% fact-check confidence
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {Array.isArray(e.sources) && e.sources.length > 0 && (
                        <View style={styles.eventSources}>
                          <SourceLinks sources={e.sources} />
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>

                {/* PHASE END */}
                {isPhaseEnd && (
                  <View style={styles.phaseEndIndicator}>
                    <View
                      style={[
                        styles.phaseEndDot,
                        { backgroundColor: activePhase.accentColor },
                      ]}
                    />
                  </View>
                )}
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
        const pad = 300;
        if (
          nativeEvent.layoutMeasurement.height +
            nativeEvent.contentOffset.y >=
          nativeEvent.contentSize.height - pad
        ) {
          loadNextStory();
        }
      }}
      scrollEventThrottle={250}
    >
      {feed.map((s) => (
        <View key={s.id}>
          {renderStoryBlock(s)}

          <CommentsSection type="story" itemId={s.id} />
        </View>
      ))}
      <Modal
        visible={factCheckModal.visible}
        animationType="fade"
        transparent
        onRequestClose={() =>
          setFactCheckModal({ visible: false, factCheck: null })
        }
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setFactCheckModal({ visible: false, factCheck: null })}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Fact-check details</Text>
            {factCheckModal.factCheck ? (
              <>
                <Text style={styles.modalScore}>
                  {factCheckModal.factCheck.confidenceScore}% confidence
                </Text>
                {factCheckModal.factCheck.explanation ? (
                  <Text style={styles.modalBody}>
                    {factCheckModal.factCheck.explanation}
                  </Text>
                ) : null}
                {factCheckModal.factCheck.lastCheckedAt ? (
                  <Text style={styles.modalMeta}>
                    Last updated:{" "}
                    {new Date(
                      factCheckModal.factCheck.lastCheckedAt
                    ).toLocaleString()}
                  </Text>
                ) : null}
              </>
            ) : null}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() =>
                setFactCheckModal({ visible: false, factCheck: null })
              }
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  storyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
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
    color: colors.textPrimary,
    fontWeight: "500",
    fontStyle: "italic",
    marginBottom: 4,
  },

  eventTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  eventSources: {
    marginTop: spacing.sm,
  },

  factCheckContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    gap: 4,
  },
  factCheckBadge: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
    alignSelf: "flex-start",
  },

  phaseEndIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    paddingLeft: spacing.sm,
  },

  phaseEndDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: spacing.lg,
    gap: 8,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
  },
  modalScore: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#6B7280",
  },
  modalClose: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCloseText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
  },
});

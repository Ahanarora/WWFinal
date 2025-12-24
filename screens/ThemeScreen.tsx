// ----------------------------------------
// screens/ThemeScreen.tsx
// PHASE SUPPORT + EventReader integration
// ----------------------------------------

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import { colors, fonts, spacing, getThemeColors } from "../styles/theme";
import SourceLinks from "../components/SourceLinks";
import RenderWithContext from "../components/RenderWithContext";
import { formatUpdatedAt, formatDateLongOrdinal } from "../utils/formatTime";
import { normalizeAnalysis } from "../utils/normalizeAnalysis";
import { useUserData } from "../contexts/UserDataContext";
import { Ionicons } from "@expo/vector-icons";
import CommentsSection from "../components/CommentsSection";
import ShareButton from "../components/ShareButton";
import { shareItem } from "../utils/share";
import EventSortToggle from "../components/EventSortToggle";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import WWHomeCard from "../components/WWHomeCard";
import { normalizeSources } from "../utils/normalizeSources";

// Shared timeline contract
import type {
  TimelineBlock,
  TimelineEventBlock,
  SourceItem,
} from "@ww/shared";
import { normalizeTimelineBlocks } from "../utils/normalizeTimelineBlocks";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Theme">;


// -------------------------------------------------
// LOCAL TYPES (Phase 2B – UI widening only)
// -------------------------------------------------


type WithOriginalIndex<T> = T & { _originalIndex: number };

type UIThemeTimelineEvent = TimelineEventBlock & {
  faqs?: any[];
  contexts?: any[];
  media?: {
    type?: string | null;
    imageUrl?: string | null;
    sourceIndex?: number;
  };
  factStatus?: "consensus" | "debated" | "partially_debated";
  factNote?: string;
  factUpdatedAt?: string | number;
};

// -------------------------------------------------
// CONSTANTS
// -------------------------------------------------
const PHASE_PALETTE = [
  "#EF4444",
  "#3B82F6",
  "#FACC15",
  "#22C55E",
  "#F97316",
  "#A855F7",
  "#14B8A6",
  "#EC4899",
  "#6366F1",
];

// -------------------------------------------------
// SCORING / SIMILARITY HELPERS
// -------------------------------------------------
const recencyWeight = (item: any) => {
  const t =
    item?.updatedAt || item?.publishedAt || item?.createdAt || item?.timestamp;
  if (!t) return 0;

  const ms =
    typeof t.toDate === "function"
      ? t.toDate().getTime()
      : t.seconds
      ? t.seconds * 1000
      : new Date(t).getTime();

  if (!ms || Number.isNaN(ms)) return 0;

  const days = (Date.now() - ms) / 86400000;
  if (days < 0) return 1;

  const capped = Math.min(days, 120);
  return Math.max(0, 1 - capped / 120);
};

const primaryCategory = (item: any) =>
  item?.category ||
  (Array.isArray(item?.allCategories) ? item.allCategories[0] : null) ||
  item?.primaryCategory ||
  item?.categories?.[0] ||
  "";

const tagSet = (item: any) => {
  const tags = new Set<string>();
  const add = (val: any) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach((v) => v && tags.add(String(v).toLowerCase()));
    } else {
      tags.add(String(val).toLowerCase());
    }
  };
  add(item?.tags);
  add(item?.allCategories);
  add(item?.category);
  add(item?.subcategory);
  return tags;
};

const scoreSimilarity = (base: any, candidate: any) => {
  if (!base || !candidate) return 0;

  const baseTags = tagSet(base);
  const candTags = tagSet(candidate);

  let shared = 0;
  candTags.forEach((t) => {
    if (baseTags.has(t)) shared += 1;
  });

  const sameCategory =
    primaryCategory(base).toLowerCase() ===
    primaryCategory(candidate).toLowerCase();

  const recency = recencyWeight(candidate);
  return shared * 3 + (sameCategory ? 4 : 0) + recency * 3;
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const getImageHeight = (aspectRatio?: number) => {
  const ar =
    typeof aspectRatio === "number" && aspectRatio > 0 ? aspectRatio : 16 / 9;
  const width = SCREEN_WIDTH - spacing.md * 2;
  return Math.round(width / ar);
};

const getFactStatusMeta = (
  status: "consensus" | "debated" | "partially_debated" | undefined
) => {
  switch (status) {
    case "debated":
      return { label: "Debated", bg: "#FEE2E2", text: "#991B1B" };
    case "partially_debated":
      return { label: "Partially Debated", bg: "#FEF9C3", text: "#854D0E" };
    default:
      return { label: "Consensus", bg: "#E8FBE3", text: "#166534" };
  }
};

const formatFactUpdated = (val?: any) => {
  if (!val) return null;
  try {
    const d =
      typeof val === "number"
        ? new Date(val)
        : typeof val?.toDate === "function"
        ? val.toDate()
        : new Date(val);
    const str = d.toLocaleString();
    if (!str || str === "Invalid Date") return null;
    return str;
  } catch {
    return null;
  }
};

// -------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------
export default function ThemeScreen({ route, navigation }: Props) {

 const { theme, index, allThemes } = (route.params || {}) as any;


  // Endless scroll
  const [feed, setFeed] = useState<any[]>(theme ? [theme] : []);
  const [currentIndex, setCurrentIndex] = useState(index ?? 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Timeline controls
  const [depth, setDepth] = useState(2);
  const [sortOrder, setSortOrder] = useState<"chronological" | "reverse">(
    "reverse"
  );

  // Suggestions pool
  const [suggestionPool, setSuggestionPool] = useState<any[]>(() => {
    if (Array.isArray(allThemes) && allThemes.length) return allThemes;
    if (Array.isArray(feed) && feed.length) return feed;
    return [];
  });

  const {
    user,
    favorites,
    toggleFavorite,
    getUpdatesSinceLastVisit,
    recordVisit,
    themeColors,
    darkMode,
  } = useUserData();

  const palette = themeColors || getThemeColors(darkMode);
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [faqModal, setFaqModal] = useState<{
    visible: boolean;
    title: string;
    faqs: any[];
  }>({
    visible: false,
    title: "",
    faqs: [],
  });
  const [factModal, setFactModal] = useState<{
    visible: boolean;
    status: "consensus" | "debated" | "partially_debated";
    note?: string;
    updatedAt?: string | number;
  }>({
    visible: false,
    status: "consensus",
    note: "",
    updatedAt: undefined,
  });

  const [faqExpanded, setFaqExpanded] = useState<Record<number, boolean>>({});

  const headerShownRef = useRef(true);
  const lastOffsetY = useRef(0);

  // -------------------------------------------------
  // EFFECTS: suggestion pool hydration
  // -------------------------------------------------
  useEffect(() => {
    if (Array.isArray(allThemes) && allThemes.length) {
      setSuggestionPool(allThemes);
      return;
    }
    if (Array.isArray(feed) && feed.length) {
      setSuggestionPool(feed);
    }
  }, [allThemes, feed]);

  useEffect(() => {
    let mounted = true;
    const loadPool = async () => {
      if (suggestionPool.length >= 5) return;
      try {
        const snap = await getDocs(collection(db, "themes"));
        if (!mounted) return;
        const data = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
        const merged = [...suggestionPool, ...data];
        const deduped: any[] = [];
        const seen = new Set<string>();
        merged.forEach((item) => {
          const key = item.docId || item.id;
          if (!key || seen.has(key)) return;
          seen.add(key);
          deduped.push(item);
        });
        setSuggestionPool(deduped);
      } catch (err) {
        console.warn("Failed to load theme suggestions", err);
      }
    };
    loadPool();
    return () => {
      mounted = false;
    };
  }, [suggestionPool.length]);

  // -------------------------------------------------
  // HEADER SHOW / HIDE
  // -------------------------------------------------
  const toggleHeader = useCallback(
    (show: boolean) => {
      if (!navigation?.getParent) return;
      if (headerShownRef.current === show) return;
      navigation.getParent()?.setOptions({ headerShown: show });
      headerShownRef.current = show;
    },
    [navigation]
  );

  const handleHeaderScroll = useCallback(
    ({ nativeEvent }: any) => {
      const y = nativeEvent?.contentOffset?.y || 0;
      const delta = y - lastOffsetY.current;
      const threshold = 20;
      if (delta > threshold) toggleHeader(false);
      else if (delta < -threshold) toggleHeader(true);
      lastOffsetY.current = y;
    },
    [toggleHeader]
  );

  useEffect(() => () => toggleHeader(true), [toggleHeader]);

  // -------------------------------------------------
  // GUARDS
  // -------------------------------------------------
  if (!theme) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>⚠️ No theme found.</Text>
      </View>
    );
  }

  // -------------------------------------------------
  // ANALYSIS + CONTEXTS
  // -------------------------------------------------
  const primaryAnalysis = normalizeAnalysis(theme.analysis);
  const primaryContexts = [
    ...(theme.contexts || []),
    ...(primaryAnalysis?.contexts || []),
  ];

  const isFavorite = (id: string) => favorites?.themes?.includes(id);

  const handleFavorite = (item: any) => {
    if (!user) {
      alert("Sign in to save themes.");
      return;
    }
    toggleFavorite("themes", item.id, {
      ...item,
      _kind: "theme",
    });
  };

  const updatesCount = (item: any) =>
    getUpdatesSinceLastVisit("themes", item);

  const renderUpdateBadge = (count: number) =>
    count > 0 ? (
      <View style={styles.updateBadge}>
        <Text style={styles.updateBadgeText}>
          {count} update{count > 1 ? "s" : ""} since you visited
        </Text>
      </View>
    ) : null;

  const hasAnyAnalysis =
    (primaryAnalysis.stakeholders?.length ?? 0) +
      (primaryAnalysis.faqs?.length ?? 0) +
      (primaryAnalysis.future?.length ?? 0) >
    0;

  useEffect(() => {
    if (theme?.id) {
      recordVisit("themes", theme.id);
    }
  }, [theme?.id, recordVisit]);

  // -------------------------------------------------
  // ENDLESS SCROLL
  // -------------------------------------------------
  const loadNextTheme = () => {
    if (isLoadingMore) return;
    if (!Array.isArray(allThemes) || currentIndex >= allThemes.length - 1)
      return;

    setIsLoadingMore(true);

    const nextIndex = currentIndex + 1;
    const nextTheme = allThemes[nextIndex];

    if (!nextTheme) {
      setIsLoadingMore(false);
      return;
    }

    if (feed.some((t) => t.id === nextTheme.id)) {
      setIsLoadingMore(false);
      return;
    }

    setFeed((prev) => [...prev, nextTheme]);
    setCurrentIndex(nextIndex);
    setIsLoadingMore(false);
  };

  // -------------------------------------------------
  // SUGGESTIONS
  // -------------------------------------------------
  const buildSuggestions = (base: any) => {
    if (!base) return { similar: [] };
    const baseId = base.id || base.docId;
    const pool = (suggestionPool || []).filter(
      (t) => (t.id || t.docId) && (t.id || t.docId) !== baseId
    );

    const similar = pool
      .map((item) => ({ item, score: scoreSimilarity(base, item) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((entry) => entry.item);

    return { similar };
  };

  const renderSuggestionsRow = (
    title: string,
    items: any[],
    onPressItem: (item: any) => void
  ) => {
    if (!items?.length) return null;
    return (
      <View style={styles.suggestionBlock}>
        <Text style={styles.suggestionTitle}>{title}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionRow}
        >
          {items.map((itm) => {
            const normalized = {
              ...itm,
              docId: itm.docId || itm.id,
              type: itm.type || "theme",
            };
            return (
              <View
                key={normalized.docId}
                style={styles.suggestionCardWrapper}
              >
                <WWHomeCard
                  item={normalized}
                  navigation={navigation}
                  onPress={() => onPressItem(normalized)}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderSuggestions = (base: any) => {
    const { similar } = buildSuggestions(base);
    if (!similar.length) return null;

    const openTheme = (item: any) =>
  navigation.push("Theme", {
    themeId: item.id,
  } as any);



    return (
      <View style={styles.suggestionsSection}>
        {renderSuggestionsRow("Continue reading", similar, openTheme)}
      </View>
    );
  };

  // -------------------------------------------------
  // RENDER ONE THEME BLOCK
  // -------------------------------------------------
  const renderThemeBlock = (item: any, isFirst: boolean) => {
    const timelineBlocks = normalizeTimelineBlocks(item.timeline) as TimelineBlock[];

    const rawTimeline =
      sortOrder === "chronological"
        ? timelineBlocks
        : [...timelineBlocks].reverse();

    const indexedTimeline = rawTimeline.map(
      (block, originalIndex) =>
        ({
          ...(block as any),
          _originalIndex: originalIndex,
        } as WithOriginalIndex<TimelineBlock>)
    );

    const analysisForItem =
      item.id === theme.id
        ? primaryAnalysis
        : normalizeAnalysis(item.analysis);

    const combinedContexts = [
      ...(item.contexts || []),
      ...(analysisForItem?.contexts || []),
    ];

    // ------------------------------
    // PHASES (from CMS)
    // ------------------------------
    const rawPhases = Array.isArray(item.phases) ? item.phases : [];
    const timelineLength = indexedTimeline.length;

    const phasesWithAccent = rawPhases.map((phase: any, idx: number) => {
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

    const phaseStartLookup = phasesWithAccent.reduce(
      (acc: Record<number, any>, phase: any) => {
        if (typeof phase?.startIndex === "number") {
          acc[phase.startIndex] = phase;
        }
        return acc;
      },
      {}
    );

    const phaseRangeLookup = phasesWithAccent.reduce(
      (acc: Record<number, any>, phase: any) => {
        if (
          typeof phase?.startIndex === "number" &&
          typeof phase?.endIndex === "number"
        ) {
          for (let idx = phase.startIndex; idx <= phase.endIndex; idx += 1) {
            acc[idx] = phase;
          }
        }
        return acc;
      },
      {}
    );

    const getPhaseForEventStart = (event: WithOriginalIndex<TimelineBlock>) => {
      if (!phasesWithAccent.length) return null;
      const idx =
        typeof event._originalIndex === "number" ? event._originalIndex : null;
      if (idx === null) return null;
      return phaseStartLookup[idx] || null;
    };

    // ------------------------------
    // DEPTH FILTERING
    // ------------------------------
    const filteredTimeline = indexedTimeline.filter((e) => {
      if (e.type === "event") {
        if (depth === 1) return e.significance === 3;
        if (depth === 2) return (e.significance || 1) >= 2;
      }
      return true;
    });

    const timelineForModal = filteredTimeline.map((block) => {
      const phase = getPhaseForEventStart(block);
      if ((block as any)?.type === "event") {
        return {
          ...(block as any),
          phaseTitle: phase?.title ?? null,
        };
      }
      return block as any;
    });

    // EventReader modal payload
  

    return (
      <View key={item.id} style={{ marginBottom: 0 }}>
        {/* COVER */}
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.coverImage} />
        )}

        {/* TITLE / META */}
        <View style={styles.themeHeaderRow}>
          <Text style={styles.title}>{item.title || "Untitled Theme"}</Text>
          <View style={styles.themeActions}>
            <ShareButton
              onPress={() =>
                shareItem({
                  type: "theme",
                  id: item.id,
                  title: item.title,
                })
              }
            />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleFavorite(item)}
            >
              <Ionicons
                name={isFavorite(item.id) ? "bookmark" : "bookmark-outline"}
                size={24}
                color={isFavorite(item.id) ? palette.accent : palette.muted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.updated}>{formatUpdatedAt(item.updatedAt)}</Text>

        <TouchableOpacity
          onPress={() => {
            if (!item.category) return;
            navigation.navigate("Search", { query: item.category } as any);
          }}
          disabled={!item.category}
        >
          <Text style={styles.category}>{item.category || "Uncategorized"}</Text>
        </TouchableOpacity>

        {/* OVERVIEW */}
        {item.overview ? (
          <View style={styles.overviewBlock}>
            <RenderWithContext
              text={item.overview}
              contexts={combinedContexts}
              navigation={navigation}
              themeColors={palette}
              textStyle={{ color: palette.textPrimary }}
            />
            {renderUpdateBadge(updatesCount(item))}
          </View>
        ) : null}

        {/* ANALYSIS BUTTONS */}
        {isFirst && hasAnyAnalysis && (
          <View style={styles.analysisButtonsRow}>
            {primaryAnalysis.stakeholders?.length > 0 && (
              <TouchableOpacity
                style={styles.analysisButton}
                onPress={() => {
                  (navigation as any).push("AnalysisModal", {
                    type: "stakeholders",
                    analysis: primaryAnalysis,
                    contexts: primaryContexts,
                  });
                }}
              >
                <Text style={styles.analysisButtonText}>Stakeholders</Text>
              </TouchableOpacity>
            )}

            {primaryAnalysis.faqs?.length > 0 && (
              <TouchableOpacity
                style={styles.analysisButton}
                onPress={() => {
                  (navigation as any).push("AnalysisModal", {
                    type: "faqs",
                    analysis: primaryAnalysis,
                    contexts: primaryContexts,
                  });
                }}
              >
                <Text style={styles.analysisButtonText}>FAQs</Text>
              </TouchableOpacity>
            )}

            {primaryAnalysis.future?.length > 0 && (
              <TouchableOpacity
                style={styles.analysisButton}
                onPress={() => {
                  (navigation as any).push("AnalysisModal", {
                    type: "future",
                    analysis: primaryAnalysis,
                    contexts: primaryContexts,
                  });
                }}
              >
                <Text style={styles.analysisButtonText}>Future?</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* DEPTH SLIDER */}
        {!item.disableDepthToggle && isFirst && rawTimeline.length > 0 && (
          <View style={styles.sliderBox}>
            <Text style={styles.sliderLabel}>Essential</Text>
            <View style={styles.sliderTrackWrap}>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={3}
                step={1}
                value={depth}
                onValueChange={(v) => setDepth(v)}
                minimumTrackTintColor={palette.accent}
                maximumTrackTintColor="#6B7280"
                thumbTintColor={palette.accent}
              />
            </View>
            <Text style={styles.sliderLabel}>Complete</Text>
          </View>
        )}

        {/* TIMELINE */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            {rawTimeline.length > 0 && isFirst && (
              <EventSortToggle sortOrder={sortOrder} onChange={setSortOrder} />
            )}
          </View>

          {filteredTimeline.length === 0 ? (
            <Text style={styles.empty}>No events for this depth.</Text>
          ) : (
            filteredTimeline.map((e, i) => {
              const idx =
                typeof e._originalIndex === "number" ? e._originalIndex : i;
              const startingPhase = getPhaseForEventStart(e);
              const activePhase = phaseRangeLookup[idx];
              const isPhaseEnd = activePhase && activePhase.endIndex === idx;
              const totalCount = filteredTimeline.length;
              const counterText = `${String(i + 1).padStart(2, "0")}/${String(
                totalCount
              ).padStart(2, "0")}`;

              if ((e as any)?.type === "image") {
                const imageUri = (e as any).url || (e as any).imageUrl || "";
                if (!imageUri) return null;
                const height = getImageHeight((e as any).aspectRatio);

                return (
                  <View key={e._originalIndex ?? i} style={styles.eventBlock}>
                    {startingPhase && (
                      <View
                        style={[
                          styles.phaseHeader,
                          { borderLeftColor: startingPhase.accentColor },
                        ]}
                      >
                        <Text style={styles.phaseTitle}>
                          {startingPhase.title}
                        </Text>
                        {startingPhase.description ? (
                          <Text style={styles.phaseSubtitle}>
                            {startingPhase.description}
                          </Text>
                        ) : null}
                      </View>
                    )}

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() =>
                        navigation.navigate("EventReader", {
                          events: timelineForModal,
                          initialIndex: i,
                        })
                      }
                    >
                      <View style={styles.imageBlock}>
                        <Image
                          source={{ uri: imageUri }}
                          style={[styles.imageFull, { height }]}
                          resizeMode="cover"
                        />
                        {((e as any).caption || (e as any).credit) && (
                          <View style={styles.imageMeta}>
                            {(e as any).caption ? (
                              <Text style={styles.imageCaption}>
                                {(e as any).caption}
                              </Text>
                            ) : null}
                            {(e as any).credit ? (
                              <Text style={styles.imageCredit}>
                                {(e as any).credit}
                              </Text>
                            ) : null}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>

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
              }

              const event = e as WithOriginalIndex<UIThemeTimelineEvent>;
              const sources = normalizeSources(event.sources) as SourceItem[];

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
                      <Text style={styles.phaseTitle}>
                        {startingPhase.title}
                      </Text>
                      {startingPhase.description ? (
                        <Text style={styles.phaseSubtitle}>
                          {startingPhase.description}
                        </Text>
                      ) : null}
                    </View>
                  )}

                  {/* EVENT */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      navigation.navigate("EventReader", {
                        events: timelineForModal,
                        initialIndex: i,
                      });
                    }}
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
                      <View style={styles.eventContent}>
                        <View style={styles.eventMetaRow}>
                          <Text style={styles.eventDate}>
                            {formatDateLongOrdinal(event.date)}
                          </Text>
                          <Text style={styles.eventCounter}>{counterText}</Text>
                        </View>

                        <View style={styles.eventTitleRow}>
                          <Text style={styles.eventTitle}>{event.title}</Text>

                          {Array.isArray(event.faqs) && event.faqs.length > 0 && (
                            <TouchableOpacity
                              style={styles.faqIcon}
                              onPress={() =>
                                setFaqModal({
                                  visible: true,
                                  title: event.title || "FAQs",
                                  faqs: event.faqs,
                                })
                              }
                              hitSlop={{
                                top: 8,
                                bottom: 8,
                                left: 8,
                                right: 8,
                              }}
                            >
                              <Ionicons
                                name="help-circle-outline"
                                size={18}
                                color={palette.accent}
                              />
                            </TouchableOpacity>
                          )}
                        </View>

                        <RenderWithContext
                          text={event.description}
                          contexts={event.contexts || []}
                          navigation={navigation}
                          themeColors={palette}
                          textStyle={{ color: palette.textPrimary }}
                        />

                        <View style={styles.factCheckContainer}>
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() =>
                              setFactModal({
                                visible: true,
                                status:
                                  (event.factStatus as
                                    | "consensus"
                                    | "debated"
                                    | "partially_debated") || "consensus",
                                note: event.factNote,
                                updatedAt: event.factUpdatedAt,
                              })
                            }
                          >
                            {(() => {
                              const meta = getFactStatusMeta(
                                event.factStatus as any
                              );
                              return (
                                <Text
                                  style={[
                                    styles.factCheckBadge,
                                    {
                                      backgroundColor: meta.bg,
                                      color: meta.text,
                                    },
                                  ]}
                                >
                                  {meta.label}
                                </Text>
                              );
                            })()}
                          </TouchableOpacity>
                        </View>

                        {sources.length > 0 ? (
                          <View style={styles.eventSources}>
                            <SourceLinks
                              sources={sources}
                              themeColors={palette}
                            />
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>

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
            })
          )}
        </View>
      </View>
    );
  };

  // ------------------------------
  // MAIN RENDER
  // ------------------------------
  return (
    <ScrollView
      style={styles.container}
      scrollEventThrottle={32}
      onScroll={({ nativeEvent }) => {
        handleHeaderScroll({ nativeEvent });
        const pad = 300;
        if (
          nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >=
          nativeEvent.contentSize.height - pad
        ) {
          loadNextTheme();
        }
      }}
    >
      {feed.map((t, i) => (
        <View key={t.id}>
          {renderThemeBlock(t, i === 0)}
          {renderSuggestions(t)}
          <CommentsSection type="theme" itemId={t.id} />
        </View>
      ))}

      {/* FACT STATUS MODAL */}
      <Modal
        visible={factModal.visible}
        animationType="fade"
        transparent
        onRequestClose={() =>
          setFactModal((prev) => ({ ...prev, visible: false }))
        }
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setFactModal((prev) => ({ ...prev, visible: false }))}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {getFactStatusMeta(factModal.status).label}
            </Text>
            {factModal.note ? (
              <Text style={styles.modalBody}>{factModal.note}</Text>
            ) : (
              <Text style={styles.modalBody}>No additional details provided.</Text>
            )}
            {formatFactUpdated(factModal.updatedAt) ? (
              <Text style={styles.modalMeta}>
                Last updated: {formatFactUpdated(factModal.updatedAt)}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.modalClose}
              onPress={() =>
                setFactModal((prev) => ({ ...prev, visible: false }))
              }
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FAQ MODAL */}
      <Modal
        visible={faqModal.visible}
        animationType="fade"
        transparent
        onRequestClose={() =>
          setFaqModal({ visible: false, title: "", faqs: [] })
        }
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => {
            setFaqModal({ visible: false, title: "", faqs: [] });
            setFaqExpanded({});
          }}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {faqModal.title || "Event FAQs"}
            </Text>

            {Array.isArray(faqModal.faqs) && faqModal.faqs.length ? (
              faqModal.faqs.map((qa, idx) => (
                <View key={idx} style={styles.faqRow}>
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    onPress={() =>
                      setFaqExpanded((prev) => ({
                        ...prev,
                        [idx]: !prev[idx],
                      }))
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalScore}>
                      {qa.question || "Question"}
                    </Text>
                    <Ionicons
                      name={faqExpanded[idx] ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={palette.textSecondary}
                    />
                  </TouchableOpacity>

                  {faqExpanded[idx] && (
                    <Text style={styles.faqAnswer}>{qa.answer || ""}</Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.modalBody}>No FAQs available.</Text>
            )}

            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => {
                setFaqModal({ visible: false, title: "", faqs: [] });
                setFaqExpanded({});
              }}
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
const createStyles = (palette: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
      padding: spacing.md,
    },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    error: { color: "red" },

    coverImage: {
      width: "100%",
      height: 240,
      borderRadius: 6,
      marginBottom: spacing.lg,
    },

    title: {
      fontFamily: fonts.heading,
      fontSize: 30,
      fontWeight: "600",
      lineHeight: 34,
      color: palette.textPrimary,
      marginBottom: spacing.sm,
    },
    themeHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    themeActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    actionButton: {
      padding: 10,
      borderRadius: 14,
    },
empty: {
  fontFamily: fonts.body,
  fontSize: 14,
  color: palette.textSecondary,
  marginVertical: spacing.sm,
},

    category: {
      fontFamily: fonts.body,
      color: palette.textSecondary,
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
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 14,
      backgroundColor: palette.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    analysisButtonText: {
      color: palette.textPrimary,
      fontFamily: fonts.body,
      fontSize: 13,
      fontWeight: "600",
    },

    sliderBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: spacing.md,
    },
    sliderTrackWrap: {
      flex: 1,
      position: "relative",
      justifyContent: "center",
    },
    slider: { flex: 1, height: 40 },
    sliderLabel: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.textSecondary,
      width: 60,
      textAlign: "center",
    },

    section: { marginBottom: spacing.lg },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontFamily: fonts.heading,
      fontSize: 22,
      fontWeight: "600",
      lineHeight: 26,
      borderBottomWidth: 1,
      borderColor: palette.border,
      paddingBottom: 4,
    },

    phaseHeader: {
      marginBottom: 12,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: palette.surface,
      borderRadius: 12,
      borderLeftWidth: 4,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    phaseTitle: {
      fontFamily: fonts.heading,
      fontSize: 15,
      color: palette.textPrimary,
      textAlign: "center",
    },
    phaseSubtitle: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: palette.textSecondary,
      textAlign: "center",
    },

    overviewBlock: {
      marginBottom: spacing.lg,
    },

    updateBadge: {
      backgroundColor: "#FEE2E2",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignSelf: "flex-start",
      marginTop: spacing.xs,
    },
    updateBadgeText: {
      fontSize: 11,
      color: palette.accent,
      fontWeight: "600",
    },

    eventBlock: {
      marginBottom: spacing.lg,
    },

    imageBlock: {
      backgroundColor: palette.surface,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
    },
    imageFull: {
      width: "100%",
      backgroundColor: palette.border,
    },
    imageMeta: {
      padding: spacing.md,
      gap: 4,
    },
    imageCaption: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 20,
      color: palette.textPrimary,
    },
    imageCredit: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.textSecondary,
    },

    eventCard: {
      backgroundColor: palette.surface,
      borderRadius: 16,
      padding: spacing.md,
      gap: spacing.sm,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    eventContent: {
      gap: 6,
    },
    eventTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },

    eventDate: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: palette.textPrimary,
      fontWeight: "500",
      fontStyle: "italic",
    },
    eventMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    eventCounter: {
      fontFamily: fonts.heading,
      fontSize: 12,
      color: palette.textSecondary,
      fontWeight: "700",
    },

    eventTitle: {
      fontFamily: fonts.heading,
      fontSize: 18,
      color: palette.textPrimary,
      fontWeight: "700",
      lineHeight: 24,
    },

    faqIcon: {
      padding: 4,
    },

    faqRow: {
      marginTop: 6,
      gap: 4,
    },
    faqQuestionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    faqAnswer: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: palette.textSecondary,
      lineHeight: 20,
    },

    factCheckContainer: {
      marginTop: spacing.sm,
    },
    factCheckBadge: {
      fontSize: 12,
      fontWeight: "700",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      alignSelf: "flex-start",
    },

    eventSources: {
      marginTop: spacing.sm,
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

    suggestionsSection: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 12,
    },
    suggestionBlock: {
      gap: 8,
    },
    suggestionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: palette.textPrimary,
    },
    suggestionRow: {
      gap: 12,
    },
    suggestionCardWrapper: {
      width: 260,
      marginRight: 8,
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      padding: spacing.md,
    },
    modalCard: {
      backgroundColor: palette.surface,
      borderRadius: 12,
      padding: spacing.lg,
      gap: 8,
    },
    modalTitle: {
      fontFamily: fonts.heading,
      fontSize: 18,
      color: palette.textPrimary,
    },
    modalScore: {
      fontFamily: fonts.heading,
      fontSize: 16,
      color: palette.textPrimary,
    },
    modalBody: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: palette.textSecondary,
      lineHeight: 20,
    },
    modalMeta: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: palette.textSecondary,
    },
    modalClose: {
      alignSelf: "flex-end",
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    modalCloseText: {
      color: palette.textPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
  });

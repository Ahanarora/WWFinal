// ----------------------------------------
// screens/StoryScreen.tsx
// (RESTORED ORIGINAL + Analysis buttons + PHASES + Event Reader phases)
// ----------------------------------------

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  Dimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import { colors, fonts, spacing, getThemeColors } from "../styles/theme";
import SourceLinks from "../components/SourceLinks";
import RenderWithContext from "../components/RenderWithContext";
import { formatUpdatedAt, formatDateLongOrdinal } from "../utils/formatTime";
import { normalizeAnalysis } from "../utils/normalizeAnalysis";
import CommentsSection from "../components/CommentsSection";
import { useUserData } from "../contexts/UserDataContext";
import { Ionicons } from "@expo/vector-icons";
import { getStorySearchCache } from "../utils/storyCache";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import ShareButton from "../components/ShareButton";
import { shareItem } from "../utils/share";
import EventSortToggle from "../components/EventSortToggle";
import WWHomeCard from "../components/WWHomeCard";

// Shared timeline contract
import type { TimelineBlock, TimelineEventBlock, SourceItem } from "@ww/shared";
import { normalizeTimelineBlocks } from "../utils/normalizeTimelineBlocks";



type WithOriginalIndex<T> = T & { _originalIndex?: number };


// ------------------------------------------------------------------
// Phase 2B: minimal typing scaffolding (NO behavior change)
// ------------------------------------------------------------------

// UI-extended event (CMS + enrichment allowed)
type UITimelineEvent = TimelineEventBlock & {
  faqs?: { question?: string; answer?: string }[];
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

// ------------------------------------------------------------------

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
    } else tags.add(String(val).toLowerCase());
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

// ------------------------------------------------------------------

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Story">;

export default function StoryScreen({ route, navigation }: Props) {
  const { id: storyId } = route.params;

// TEMP bridge until Story is fetched by ID
const { story, index, allStories } =
  (route.params as any) || {};


  // Endless scroll state
  const [feed, setFeed] = useState<any[]>(story ? [story] : []);
  const [currentIndex, setCurrentIndex] = useState(index ?? 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Suggestion pool
  const [suggestionPool, setSuggestionPool] = useState<any[]>(() => {
    if (Array.isArray(allStories) && allStories.length) return allStories;
    const cached = getStorySearchCache();
    return Array.isArray(cached) ? cached : [];
  });

  // Depth slider
  const [depth, setDepth] = useState(2);

  const {
    user,
    favorites,
    toggleFavorite,
    recordVisit,
    themeColors,
    darkMode,
  } = useUserData();

  const headerShownRef = useRef(true);
  const lastOffsetY = useRef(0);

  const palette = themeColors || getThemeColors(darkMode);
  const styles = useMemo(() => createStyles(palette), [palette]);

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

  const [sortOrder, setSortOrder] = useState<"chronological" | "reverse">(
    "chronological"
  );

  const [faqModal, setFaqModal] = useState<{
    visible: boolean;
    title: string;
    faqs: any[];
  }>({ visible: false, title: "", faqs: [] });
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

  const isFavoriteStory = (id: string) =>
    favorites?.stories?.includes(id);

  const handleFavorite = (item: any) => {
    if (!user) {
      alert("Sign in to save stories.");
      return;
    }
    toggleFavorite("stories", item.id, {
      ...item,
      _kind: "story",
    });
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

  if (!story) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>⚠️ No story found.</Text>
      </View>
    );
  }

  const primaryAnalysis = normalizeAnalysis(story.analysis);

  useEffect(() => {
    if (story?.id) recordVisit("stories", story.id);
  }, [story?.id, recordVisit]);

  const primaryContexts = [
    ...(story.contexts || []),
    ...(primaryAnalysis?.contexts || []),
  ];


// PART 2 / 3
// (Continue from where PART 1 ended — do not paste alone.)
// ----------------------------------------

  useEffect(() => {
    if (Array.isArray(allStories) && allStories.length) {
      setSuggestionPool(allStories);
    }
  }, [allStories]);

  useEffect(() => {
    let mounted = true;
    const loadPool = async () => {
      // Lightweight fetch to ensure at least a few suggestions in the pool
      if (suggestionPool.length >= 5) return;
      try {
        const snap = await getDocs(collection(db, "stories"));
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
        console.warn("Failed to load suggestions", err);
      }
    };
    loadPool();
    return () => {
      mounted = false;
    };
  }, [suggestionPool.length]);

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
  // Suggestions
  // ---------------------------------------------------------
  const buildSuggestions = (base: any) => {
    if (!base) return { similar: [] as any[] };
    const baseId = base.id || base.docId;
    const pool = (suggestionPool || []).filter(
      (s) => (s.id || s.docId) && (s.id || s.docId) !== baseId
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
    onPressItem: (itm: any) => void
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
              type: itm.type || "story",
            };
            return (
              <View key={normalized.docId} style={styles.suggestionCardWrapper}>
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

    const openStory = (item: any) =>
     navigation.push("Story", {
  id: item.id,
});



    return (
      <View style={styles.suggestionsSection}>
        {renderSuggestionsRow("Continue reading", similar, openStory)}
      </View>
    );
  };

  // ---------------------------------------------------------
  // Render a single Story block (timeline + phases)
  // ---------------------------------------------------------
  const renderStoryBlock = (item: any) => {
    const timelineBlocks = normalizeTimelineBlocks(
      item.timeline
    ) as TimelineBlock[];

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

    const filteredTimeline = indexedTimeline.filter((block: any) => {
      if (block.type === "event") {
        if (depth === 1) return block.significance === 3;
        if (depth === 2) return (block.significance || 1) >= 2;
      }
      return true;
    });

    const analysisForItem =
      item.id === story.id ? primaryAnalysis : normalizeAnalysis(item.analysis);

    const combinedContexts = [
      ...(item.contexts || []),
      ...(analysisForItem?.contexts || []),
    ];

    // Phases from CMS
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

    const getPhaseForBlockStart = (event: WithOriginalIndex<TimelineBlock>) => {
      if (!phasesWithAccent.length) return null;
      const idx =
        typeof event._originalIndex === "number" ? event._originalIndex : null;
      if (idx === null) return null;
      return phaseStartLookup[idx] || null;
    };

    // Modal expects event blocks, plus phaseTitle injected for phase headers
    const timelineForModal = filteredTimeline.map((block) => {
      const phase = getPhaseForBlockStart(block);
      if ((block as any)?.type === "event") {
        return {
          ...(block as any),
          phaseTitle: phase?.title ?? null,
        };
      }
      return block as any;
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
          <View style={styles.storyActions}>
            <ShareButton
              onPress={() =>
                shareItem({
                  type: "story",
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
                name={isFavoriteStory(item.id) ? "bookmark" : "bookmark-outline"}
                size={24}
                color={isFavoriteStory(item.id) ? palette.accent : palette.muted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.updated}>{formatUpdatedAt(item.updatedAt)}</Text>

        <TouchableOpacity
          onPress={() =>
            item.category &&
            navigation.navigate("Search", {
  query: item.category,
})

          }
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
                    title: "Stakeholders",
                    content: "",
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
                    title: "Stakeholders",
                    content: "",
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
                   title: "Stakeholders",
                   content: "",
                 })
                }
              >
                <Text style={styles.analysisButtonText}>Future?</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* DEPTH SLIDER */}
        {feed[0]?.id === item.id && filteredTimeline.length > 0 && (
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
            {filteredTimeline.length > 0 && feed[0]?.id === item.id && (
              <EventSortToggle sortOrder={sortOrder} onChange={setSortOrder} />
            )}
          </View>

          {filteredTimeline.map((block, i) => {
            const startingPhase = getPhaseForBlockStart(block as any);
            const idx =
              typeof block._originalIndex === "number" ? block._originalIndex : i;
            const activePhase = phaseRangeLookup[idx];
            const isPhaseEnd = activePhase && activePhase.endIndex === idx;
            const totalCount = filteredTimeline.length;
            const counterText = `${String(i + 1).padStart(2, "0")}/${String(
              totalCount
            ).padStart(2, "0")}`;

            if ((block as any)?.type === "image") {
              const imageUri = (block as any).url || (block as any).imageUrl || "";
              if (!imageUri) return null;
              const height = getImageHeight((block as any).aspectRatio);

              return (
                <View key={block._originalIndex ?? i} style={styles.eventBlock}>
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

                  <Pressable
                    onPress={() =>
                      navigation.navigate("EventReader", {
                        events: timelineForModal,
                        initialIndex: i,
                      })
                    }
                    android_disableSound={true}
                  >
                    <View style={styles.imageBlock}>
                      <Image
                        source={{ uri: imageUri }}
                        style={[styles.imageFull, { height }]}
                        resizeMode="cover"
                      />
                      {((block as any).caption || (block as any).credit) && (
                        <View style={styles.imageMeta}>
                          {(block as any).caption ? (
                            <Text style={styles.imageCaption}>
                              {(block as any).caption}
                            </Text>
                          ) : null}
                          {(block as any).credit ? (
                            <Text style={styles.imageCredit}>
                              {(block as any).credit}
                            </Text>
                          ) : null}
                        </View>
                      )}
                    </View>
                  </Pressable>

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

            const e = block as WithOriginalIndex<UITimelineEvent>;

            const sources = (Array.isArray(e.sources) ? e.sources : []) as SourceItem[];
            const description = e.description || "";
            const contexts = e.contexts || [];

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
                      initialIndex: i,
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
                    <View style={styles.eventContent}>
                      <View style={styles.eventMetaRow}>
                        <Text style={styles.eventDate}>
                          {formatDateLongOrdinal(e.date)}
                        </Text>
                        <Text style={styles.eventCounter}>{counterText}</Text>
                      </View>

                      <View style={styles.eventTitleRow}>
                        <Text style={styles.eventTitle}>{e.title}</Text>

                        {Array.isArray(e.faqs) && e.faqs.length > 0 && (
                          <TouchableOpacity
                            style={styles.faqIcon}
                            onPress={() =>
                              setFaqModal({
                                visible: true,
                                title: e.title || "FAQs",
                                faqs: e.faqs,
                              })
                            }
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
                        text={description}
                        contexts={contexts}
                        navigation={navigation}
                        themeColors={palette}
                        textStyle={{}}
                      />

                      <View style={styles.factCheckContainer}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() =>
                            setFactModal({
                              visible: true,
                              status:
                                ((e as any).factStatus as
                                  | "consensus"
                                  | "debated"
                                  | "partially_debated") || "consensus",
                              note: (e as any).factNote,
                              updatedAt: (e as any).factUpdatedAt,
                            })
                          }
                        >
                          {(() => {
                            const meta = getFactStatusMeta(
                              (e as any).factStatus as any
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

                      {/* SOURCES */}
                      {sources.length > 0 ? (
                        <View style={styles.eventSources}>
                          <SourceLinks sources={sources} themeColors={palette} />
                        </View>
                      ) : null}
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

  // ----------------------------------------
// screens/StoryScreen.tsx
// PART 3 / 3
// (Final part — after this you will replace the file ONCE)
// ----------------------------------------

  return (
    <ScrollView
      style={styles.container}
      onScroll={({ nativeEvent }) => {
        handleHeaderScroll({ nativeEvent });
        const pad = 300;
        if (
          nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >=
          nativeEvent.contentSize.height - pad
        ) {
          loadNextStory();
        }
      }}
      scrollEventThrottle={32}
    >
      {feed.map((s) => (
        <View key={s.id}>
          {renderStoryBlock(s)}
          {renderSuggestions(s)}
          <CommentsSection type="story" itemId={s.id} />
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
            <Text style={styles.modalTitle}>{getFactStatusMeta(factModal.status).label}</Text>
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
      padding: 2,
    },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    error: { color: "red" },

    coverImage: {
      width: "100%",
      height: 240,
      borderRadius: 4,
      marginBottom: spacing.lg,
    },

empty: {
  fontFamily: fonts.body,
  fontSize: 14,
  color: palette.textSecondary,
  marginVertical: spacing.sm,
},


    title: {
      fontFamily: fonts.heading,
      fontSize: 30,
      fontWeight: "600",
      lineHeight: 34,
      color: palette.textPrimary,
      marginBottom: spacing.sm,
    },
    storyHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    storyActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    actionButton: {
      padding: 10,
      borderRadius: 14,
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
      color: palette.textSecondary,
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
      shadowColor: "#0F172A",
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
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
      color: palette.textPrimary,
    },

    phaseHeader: {
      marginBottom: 12,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: palette.surface,
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },

    eventContent: {
      gap: 6,
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

    eventTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    eventTitle: {
      fontFamily: fonts.heading,
      fontSize: 18,
      fontWeight: "700",
      lineHeight: 24,
      color: palette.textPrimary,
    },
    faqIcon: {
      padding: 4,
    },

    eventSources: {
      marginTop: spacing.sm,
    },

    factCheckContainer: {
      marginTop: 6,
    },
    factCheckBadge: {
      fontSize: 12,
      fontWeight: "700",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
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

    suggestionsSection: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 12,
    },
    suggestionBlock: {
      gap: 8,
    },
    suggestionTitle: {
      fontFamily: fonts.heading,
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

    modalCard: {
      backgroundColor: palette.surface,
      borderRadius: 12,
      padding: spacing.lg,
      gap: 8,
      borderWidth: 1,
      borderColor: palette.border,
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

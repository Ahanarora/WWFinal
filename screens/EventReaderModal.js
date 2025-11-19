// ----------------------------------------
// screens/EventReaderModal.js
// Full-screen vertical event reader (Inshorts-style, fade-in + phases)
// ----------------------------------------
import React, { useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Image,
  StatusBar,
  Animated,
} from "react-native";
import { colors, fonts, spacing } from "../styles/theme";
import RenderWithContext from "../components/RenderWithContext";
import SourceLinks from "../components/SourceLinks";
import { formatDateDDMMYYYY } from "../utils/formatTime";

// -------------------------------
// Reusable card for each event
// -------------------------------
const EventCard = React.memo(function EventCard({
  event,
  navigation,
  headerTitle,
}) {
  if (!event) return null;

  const {
    date = "",
    title = "",
    description = "",
    contexts = [],
    sources = [],
    imageUrl = null,
    phaseTitle = null,
  } = event;

  const formattedDate = date ? formatDateDDMMYYYY(date) : "";

  return (
    <View style={styles.cardInner}>
      {/* STORY/THEME TITLE */}
      {headerTitle ? (
        <Text style={styles.modalStoryTitle}>{headerTitle}</Text>
      ) : null}

      {/* PHASE TITLE */}
      {phaseTitle ? (
        <Text style={styles.modalPhaseTitle}>{phaseTitle}</Text>
      ) : null}

      {/* IMAGE */}
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : null}

      {/* CONTENT */}
      <View style={styles.content}>
        {formattedDate ? <Text style={styles.date}>{formattedDate}</Text> : null}
        {title ? <Text style={styles.title}>{title}</Text> : null}

        {description ? (
          <View style={styles.body}>
            <RenderWithContext
              text={description}
              contexts={contexts}
              navigation={navigation}
            />
          </View>
        ) : null}

        {/* SOURCES */}
        {Array.isArray(sources) && sources.length > 0 && (
          <View style={styles.sources}>
            <SourceLinks sources={sources} />
          </View>
        )}
      </View>
    </View>
  );
});

// ----------------------------------------
// MAIN READER COMPONENT
// ----------------------------------------
export default function EventReaderModal({ route, navigation }) {
  const {
    events: rawEvents = [],
    startIndex = 0,
    headerTitle = "",
  } = route.params || {};

  // Normalize event data
  const safeEvents = useMemo(() => {
    if (!Array.isArray(rawEvents)) return [];

    return rawEvents
      .filter(Boolean)
      .map((e) => ({
        date: e?.date || "",
        title: e?.event || "",
        description: e?.description || "",
        contexts: Array.isArray(e?.contexts) ? e.contexts : [],
        sources: Array.isArray(e?.sources) ? e.sources : [],
        imageUrl: e?.imageUrl || e?.image || e?.thumbnail || null,
        phaseTitle: e?.phaseTitle || null,
      }));
  }, [rawEvents]);

  const [index, setIndex] = useState(
    Math.min(Math.max(startIndex, 0), Math.max(safeEvents.length - 1, 0))
  );

  const [isTransitioning, setIsTransitioning] = useState(false);
  const anim = useRef(new Animated.Value(1)).current;

  if (!safeEvents || safeEvents.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text>No events to show.</Text>
      </View>
    );
  }

  const currentEvent = safeEvents[index];

  // --------------------------
  // SIMPLE FADE-IN TRANSITION (SINGLE CARD)
  // --------------------------
  const startTransition = (targetIndex) => {
    if (targetIndex === index) return;
    if (targetIndex < 0 || targetIndex > safeEvents.length - 1) return;
    if (isTransitioning) return;

    setIsTransitioning(true);

    // Immediately switch to the new event, but start from opacity 0
    setIndex(targetIndex);
    anim.setValue(0);

    Animated.timing(anim, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setIsTransitioning(false);
    });
  };

  // --------------------------
  // SWIPE HANDLER
  // --------------------------
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => {
          // Only start on vertical gestures
          return Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx);
        },
        onPanResponderMove: () => {},
        onPanResponderRelease: (_, g) => {
          if (isTransitioning) return;

          const { dy, vy } = g;
          const threshold = 80;
          const velocityThreshold = 0.3;

          const isSwipeUp =
            dy < -threshold || (dy < 0 && Math.abs(vy) > velocityThreshold);
          const isSwipeDown =
            dy > threshold || (dy > 0 && Math.abs(vy) > velocityThreshold);

          // NEXT
          if (isSwipeUp && index < safeEvents.length - 1) {
            startTransition(index + 1);
            return;
          }

          // PREVIOUS (or close if at first)
          if (isSwipeDown) {
            if (index > 0) {
              startTransition(index - 1);
            } else {
              navigation.goBack();
            }
          }
        },
      }),
    [index, isTransitioning, safeEvents.length, navigation]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HANDLE */}
      <View style={styles.dragHandle} />

      {/* COUNTER */}
      <View style={styles.counterRow}>
        <Text style={styles.counterText}>
          {index + 1} / {safeEvents.length}
        </Text>
      </View>

      {/* SINGLE CARD (NO STACK) */}
      <View style={styles.cardStack} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.cardLayer,
            {
              opacity: anim,
            },
          ]}
        >
          <EventCard
            event={currentEvent}
            navigation={navigation}
            headerTitle={headerTitle}
          />
        </Animated.View>
      </View>
    </View>
  );
}

// ----------------------------------------
// STYLES
// ----------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 24,
  },

  dragHandle: {
    alignSelf: "center",
    width: 50,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    marginBottom: 8,
  },

  counterRow: {
    alignItems: "center",
    marginBottom: 4,
  },

  counterText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#6B7280",
  },

  cardStack: {
    flex: 1,
    position: "relative",
  },

  cardLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
  },

  cardInner: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  modalStoryTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: "#111827",
    paddingHorizontal: spacing.md,
    paddingBottom: 2,
  },

  modalPhaseTitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "#6B7280",
    paddingHorizontal: spacing.md,
    paddingBottom: 8,
  },

  image: {
    width: "100%",
    height: 220,
    backgroundColor: "#E5E7EB",
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },

  date: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },

  title: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  body: {
    marginTop: 4,
    marginBottom: spacing.md,
  },

  sources: {
    marginTop: 8,
  },
});

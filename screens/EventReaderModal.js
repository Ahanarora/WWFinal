// ----------------------------------------
// screens/EventReaderModal.js
// Full-screen vertical event reader (Inshorts-style)
// ----------------------------------------
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Image,
  StatusBar,
} from "react-native";
import { colors, fonts, spacing } from "../styles/theme";
import RenderWithContext from "../components/RenderWithContext";
import SourceLinks from "../components/SourceLinks";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function EventReaderModal({ route, navigation }) {
  const { events = [], startIndex = 0 } = route.params || {};
  const [index, setIndex] = useState(
    Math.min(Math.max(startIndex, 0), Math.max(events.length - 1, 0))
  );

  const translateY = useRef(new Animated.Value(0)).current;

  if (!Array.isArray(events) || events.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>No events to show.</Text>
      </View>
    );
  }

  const current = events[index];

  const animateTo = (toValue, cb) => {
    Animated.timing(translateY, {
      toValue,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
      cb && cb();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 10,
      onPanResponderMove: (_, gesture) => {
        translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        const { dy, vy } = gesture;
        const threshold = 80;
        const velocityThreshold = 0.3;

        // Swipe up → next event
        if (
          (dy < -threshold || (dy < 0 && Math.abs(vy) > velocityThreshold)) &&
          index < events.length - 1
        ) {
          animateTo(-SCREEN_HEIGHT, () => {
            setIndex((prev) => prev + 1);
          });
          return;
        }

        // Swipe down → previous or close
        if (dy > threshold || (dy > 0 && Math.abs(vy) > velocityThreshold)) {
          if (index > 0) {
            // previous event
            animateTo(SCREEN_HEIGHT, () => {
              setIndex((prev) => prev - 1);
            });
          } else {
            // at first card: close modal
            animateTo(SCREEN_HEIGHT, () => {
              navigation.goBack();
            });
          }
          return;
        }

        // Not enough movement → snap back
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* Optional: dark status bar text on white */}
      <StatusBar barStyle="dark-content" />

      {/* Small drag handle to hint swipe */}
      <View style={styles.dragHandle} />

      {/* Position indicator */}
      <View style={styles.counterRow}>
        <Text style={styles.counterText}>
          {index + 1} / {events.length}
        </Text>
      </View>

      <Animated.View
        style={[styles.card, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        {/* IMAGE */}
        {current.imageUrl ? (
          <Image source={{ uri: current.imageUrl }} style={styles.image} />
        ) : null}

        {/* CONTENT */}
        <View style={styles.content}>
          <Text style={styles.date}>{current.date}</Text>
          <Text style={styles.title}>{current.event}</Text>

          <View style={styles.body}>
            <RenderWithContext
              text={current.description}
              contexts={current.contexts || []}
              navigation={navigation}
            />
          </View>

          {/* SOURCES */}
          {Array.isArray(current.sources) && current.sources.length > 0 && (
            <View style={styles.sources}>
              <SourceLinks sources={current.sources} />
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

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

  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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

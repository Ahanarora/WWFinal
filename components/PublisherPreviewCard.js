// components/PublisherPreviewCard.js
import React from "react";
import { View, Text, StyleSheet, Image, Pressable, Linking } from "react-native";

export default function PublisherPreviewCard({ source, palette }) {
  if (!source?.link) return null;

  const title = source.title || "Open source";
  const sourceName = source.sourceName || "";

  const open = async () => {
    try {
      await Linking.openURL(source.link);
    } catch (e) {
      console.warn("Failed to open URL", e);
    }
  };

  return (
    <Pressable onPress={open} android_disableSound={true}>
      <View style={[styles.card, { borderColor: palette?.border || "#E5E7EB" }]}>
        {source.imageUrl ? (
          <Image source={{ uri: source.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>📰</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text numberOfLines={3} style={[styles.headline, { color: palette?.textPrimary || "#111827" }]}>
            {title}
          </Text>

          <Text style={[styles.credits, { color: palette?.textSecondary || "#6B7280" }]}>
            {sourceName ? `Source: ${sourceName}` : "Source"}
          </Text>

          <Text style={[styles.cta, { color: palette?.accent || "#2563EB" }]}>
            Tap to open ↗
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: 170,
    backgroundColor: "#E5E7EB",
  },
  placeholder: {
    width: "100%",
    height: 170,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: { fontSize: 24 },
  content: { padding: 12, gap: 6 },
  headline: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  credits: { fontSize: 12, fontWeight: "600" },
  cta: { fontSize: 12, fontWeight: "700" },
});

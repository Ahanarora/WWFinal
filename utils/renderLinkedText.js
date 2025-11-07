// utils/renderLinkedText.js
import React from "react";
import { Text, TouchableOpacity, Linking, View } from "react-native";

/**
 * Converts text like:
 *   [Label](@story/abc)
 *   @[Label](@story/abc)
 *   [Label](@[Title](@story/abc))
 *   [Reuters](https://reuters.com)
 * into tappable links inside RN <Text>.
 */
export function renderLinkedText(text, navigation) {
  if (!text) return <Text>{text}</Text>;

  // Normalize weird nested formats first
  const cleaned = text.replace(
    /\]\(@\[.*?\]\(@(story|theme)\/([A-Za-z0-9_-]+)\)\)/g,
    "](@$1/$2)"
  );

  // Markdown-style links → [label](target)
  const regex =
    /\[([^\]]+)\]\((@(?:story|theme)\/[A-Za-z0-9_-]+|https?:\/\/[^\s)]+)\)/g;

  const nodes = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(cleaned)) !== null) {
    const [full, label, target] = match;
    const before = cleaned.slice(lastIndex, match.index);
    if (before) nodes.push({ type: "text", value: before });
    nodes.push({ type: "link", label, target });
    lastIndex = match.index + full.length;
  }
  if (lastIndex < cleaned.length)
    nodes.push({ type: "text", value: cleaned.slice(lastIndex) });

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {nodes.map((n, i) => {
        if (n.type === "text") {
          return (
            <Text key={i} style={{ color: "#222" }}>
              {n.value}
            </Text>
          );
        }

        const { label, target } = n;
        const isInternal = target.startsWith("@story/") || target.startsWith("@theme/");
        const isTheme = target.startsWith("@theme/");
        const id = isInternal ? target.split("/")[1] : null;

        return (
          <TouchableOpacity
            key={i}
            onPress={() => {
              if (isInternal) {
                navigation.navigate(isTheme ? "Theme" : "Story", { id });
              } else {
                Linking.openURL(target);
              }
            }}
          >
            <Text style={{ color: "#2563EB", textDecorationLine: "underline" }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

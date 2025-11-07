// utils/renderLinkedText.js
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Parse [Label](@story/ID) or [Label](@theme/ID) or [Label](https://...) into JSX tokens.
 * Returns an array of nodes (text or link elements).
 */
export function parseLinkedText(text, navigation) {
  if (typeof text !== "string" || !text) return [<Text>{text}</Text>];

  const regex = /\[([^\]]+)\]\((@?(story|theme)\/[A-Za-z0-9_-]+|https?:\/\/[^\s)]+)\)/g;
  const nodes = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const [full, label, target] = match;

    if (match.index > lastIndex) {
      nodes.push({
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }

    if (target.startsWith("@story/") || target.startsWith("@theme/")) {
      const [type, id] = target.replace("@", "").split("/");
      nodes.push({
        type: "internalLink",
        label,
        linkType: type,
        id,
      });
    } else {
      nodes.push({
        type: "externalLink",
        label,
        href: target,
      });
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length)
    nodes.push({ type: "text", value: text.slice(lastIndex) });

  return nodes;
}

/**
 * Simple fallback renderer (if you want to use directly)
 */
export function renderLinkedText(text, navigation) {
  const nodes = parseLinkedText(text, navigation);

  return (
    <>
      {nodes.map((n, i) => {
        if (n.type === "text")
          return <Text key={i}>{n.value}</Text>;

        if (n.type === "internalLink")
          return (
            <TouchableOpacity
              key={i}
              onPress={async () => {
                const ref = doc(db, `${n.linkType}s`, n.id);
                const snap = await getDoc(ref);
                if (!snap.exists()) {
                  alert(`⚠️ ${n.linkType} not found`);
                  return;
                }
                const data = { id: n.id, ...snap.data() };
                navigation.navigate(
                  n.linkType === "story" ? "Story" : "Theme",
                  { [n.linkType]: data }
                );
              }}
            >
              <Text
                style={{
                  color: "#2563EB",
                  textDecorationLine: "underline",
                }}
              >
                {n.label}
              </Text>
            </TouchableOpacity>
          );

        if (n.type === "externalLink")
          return (
            <Text
              key={i}
              style={{ color: "#2563EB", textDecorationLine: "underline" }}
              onPress={() => Linking.openURL(n.href)}
            >
              {n.label}
            </Text>
          );
      })}
    </>
  );
}

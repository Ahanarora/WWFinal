// utils/renderLinkedText.js
import React from "react";
import { Text, Linking } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";

/**
 * Parse [Label](@story/ID) or [Label](@theme/ID) or [Label](https://...) into nodes.
 */
export function parseLinkedText(text) {
  if (typeof text !== "string" || !text) return [<Text>{text}</Text>];

  const regex =
    /\[([^\]]+)\]\((@?(story|theme)\/[A-Za-z0-9_-]+|https?:\/\/[^\s)]+)\)/g;

  const nodes = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const [full, label, target] = match;

    // Push preceding plain text, if any
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
        linkType: type, // "story" | "theme"
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

  if (lastIndex < text.length) {
    nodes.push({ type: "text", value: text.slice(lastIndex) });
  }

  return nodes;
}

/**
 * Render parsed text to RN elements.
 */
export function renderLinkedText(text, navigation, themeColors) {
  const nodes = parseLinkedText(text);
  const linkColor = themeColors?.accent || "#14532d";

  return (
    <>
      {nodes.map((n, i) => {
        // Plain text
        if (n.type === "text") {
          return <Text key={i}>{n.value}</Text>;
        }

        // Internal links: @story/id or @theme/id
        if (n.type === "internalLink") {
          return (
            <Text
              key={i}
              style={{
                color: linkColor,
                textDecorationLine: "underline",
              }}
              onPress={async () => {
                try {
                  const collection =
                    n.linkType === "story" ? "stories" : "themes";

                  console.log(
                    "🔎 Fetching path:",
                    `${collection}/${n.id}`
                  );

                  const ref = doc(db, collection, n.id);
                  const snap = await getDoc(ref);

                  if (!snap.exists()) {
                    alert(`⚠️ ${n.linkType} not found`);
                    return;
                  }

                  const data = { id: snap.id, ...snap.data() };

                  console.log(
                    "✅ Document found: –",
                    data.title || data.name || data.id
                  );

                  // Use Stack route names from App.tsx
                  const screen = n.linkType === "story" ? "Story" : "Theme";

                  // Your choice: PUSH (stack of stories/themes)
                  if (n.linkType === "story") {
                    navigation.push(screen, {
                      story: data,
                      index: 0,
                      allStories: [data],
                    });
                  } else {
                    navigation.push(screen, {
                      theme: data,
                      index: 0,
                      allThemes: [data],
                    });
                  }
                } catch (err) {
                  console.log("⚠️ link nav error:", err);
                }
              }}
            >
              {n.label}
            </Text>
          );
        }

        // External link
        if (n.type === "externalLink") {
          return (
            <Text
              key={i}
              style={{
                color: linkColor,
                textDecorationLine: "underline",
              }}
              onPress={() => Linking.openURL(n.href)}
            >
              {n.label}
            </Text>
          );
        }

        return null;
      })}
    </>
  );
}

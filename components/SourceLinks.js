// ----------------------------------------
// components/SourceLinks.js
// ----------------------------------------
import React from "react";
import {
View,
Text,
ScrollView,
TouchableOpacity,
Image,
StyleSheet,
Linking,
} from "react-native";
import { fonts, colors, spacing } from "../styles/theme";

export default function SourceLinks({ sources = [] }) {
if (!Array.isArray(sources) || sources.length === 0) return null;

return (
<ScrollView
horizontal
showsHorizontalScrollIndicator={false}
contentContainerStyle={styles.container}
>
{sources.map((s, i) => {
let favicon = "[https://via.placeholder.com/24?text=📰](https://via.placeholder.com/24?text=%F0%9F%93%B0)";
try {
const origin = new URL(s.link).origin;
favicon = `${origin}/favicon.ico`;
} catch (err) {}

    return (
      <TouchableOpacity
        key={i}
        style={styles.card}
        onPress={() => Linking.openURL(s.link)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: favicon }}
          style={styles.favicon}
          onError={(e) => {
            e.currentTarget.src =
              "<https://via.placeholder.com/24?text=📰>";
          }}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>
            {s.title || "Untitled Article"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  })}
</ScrollView>

);
}

const styles = StyleSheet.create({
container: {
flexDirection: "row",
gap: 8,
paddingVertical: spacing.xs || 4,
},
card: {
flexDirection: "row",
alignItems: "center",
backgroundColor: "#f8f8f8",
borderRadius: 8,
paddingVertical: 6,
paddingHorizontal: 10,
borderWidth: 1,
borderColor: "#eee",
minWidth: 170,
maxWidth: 200,
},
favicon: {
width: 18,
height: 18,
borderRadius: 4,
marginRight: 8,
backgroundColor: "#ddd",
},
title: {
fontFamily: fonts.body, // ✅ now consistent with rest of app
fontSize: 12.5,         // ✅ slightly smaller than event text
lineHeight: 16,
color: colors.textPrimary,
flexShrink: 1,
},
});
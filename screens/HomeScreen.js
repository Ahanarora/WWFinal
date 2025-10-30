import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { colors, fonts, spacing } from "../styles/theme";

export default function HomeScreen({ navigation }) {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const snapshot = await getDocs(collection(db, "themes"));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setThemes(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading articles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={themes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.articleCard}
            onPress={() => navigation.navigate("Theme", { theme: item })}
          >
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
            )}
            <View style={styles.textContainer}>
              <Text style={styles.category}>
                {item.category?.toUpperCase() || "GENERAL"}
              </Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.overview} numberOfLines={3}>
                {item.overview}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: colors.textSecondary, marginTop: 8 },
  articleCard: {
    flexDirection: "column",
    paddingBottom: spacing.md,
  },
  thumbnail: {
    width: "100%",
    height: 180,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  textContainer: {},
  category: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1,
    fontFamily: fonts.body,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  overview: {
    fontSize: 15,
    color: colors.textSecondary,
    fontFamily: fonts.body,
    lineHeight: 22,
  },
  separator: {
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
  },
});

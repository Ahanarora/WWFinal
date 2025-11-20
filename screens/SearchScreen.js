import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatUpdatedAt } from "../utils/formatTime";

const getTimestampMs = (value) => {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value.seconds) return value.seconds * 1000;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

export default function SearchScreen({ route, navigation }) {
  const stories = route.params?.stories || [];
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const computed = stories
      .map((story) => {
        const title = (story.title || "").toLowerCase();
        const overview = (story.overview || "").toLowerCase();
        const analysisSummary = (story.analysis?.summary || "").toLowerCase();
        let score = 0;
        if (title.includes(debouncedQuery)) score += 3;
        if (overview.includes(debouncedQuery)) score += 1;
        if (analysisSummary.includes(debouncedQuery)) score += 1;
        return { story, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return getTimestampMs(b.story.updatedAt) - getTimestampMs(a.story.updatedAt);
      })
      .map((entry) => entry.story);

    setResults(computed);
  }, [debouncedQuery, stories]);

  const renderItem = ({ item }) => {
    const previewSource = item.overview || item.analysis?.summary || "";
    const preview = previewSource.slice(0, 160);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("Story", {
            story: item,
            index: 0,
            allStories: [item],
          })
        }
      >
        <Text style={styles.category}>{item.category || "Uncategorized"}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>{formatUpdatedAt(item.updatedAt)}</Text>
        {!!preview && <Text style={styles.preview}>{preview}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search stories"
          placeholderTextColor="#9CA3AF"
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}> 
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {debouncedQuery.length === 0 ? (
        <Text style={styles.helperText}>Type to search across stories.</Text>
      ) : results.length === 0 ? (
        <Text style={styles.helperText}>No matches found.</Text>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 999,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  helperText: {
    color: "#64748B",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  category: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 6,
  },
  preview: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 20,
  },
});

// ----------------------------------------
// screens/ThemesScreen.js
// ----------------------------------------
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function ThemesScreen({ navigation }) {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const snapshot = await getDocs(collection(db, "themes"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setThemes(data);
      } catch (err) {
        console.error("Error fetching themes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchThemes();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-600 mt-2">Loading themes...</Text>
      </View>
    );
  }

  if (themes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-gray-500">No themes available yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="p-4 bg-gray-50">
      {themes.map((theme) => (
        <TouchableOpacity
          key={theme.id}
          onPress={() => navigation.navigate("Theme", { theme })}
          className="bg-white rounded-2xl shadow-sm mb-5 overflow-hidden"
          style={{ elevation: 2 }}
        >
          {theme.imageUrl && (
            <Image
              source={{ uri: theme.imageUrl }}
              style={{
                width: "100%",
                height: 180,
                resizeMode: "cover",
              }}
            />
          )}

          <View className="p-4 space-y-2">
            <Text className="text-xs uppercase text-gray-500 font-semibold">
              {theme.category || "General"}
            </Text>
            <Text className="text-lg font-semibold">{theme.title}</Text>
            <Text className="text-gray-700 text-sm leading-5">
              {theme.overview?.length > 150
                ? theme.overview.slice(0, 150) + "..."
                : theme.overview}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

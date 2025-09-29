import React, { useEffect, useState } from "react";
import { View, FlatList, Text, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Provider as PaperProvider } from "react-native-paper";

import { listenToStories, listenToThemes } from "./utils/firebase";
import NewsCard from "./components/NewsCard";
import StoryScreen from "./screens/StoryScreen";
import ThemeScreen from "./screens/ThemeScreen";

// --- Home Screen ---
function HomeScreen({ navigation }) {
  const [stories, setStories] = useState([]);
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubStories = listenToStories((data) => setStories(data));
    const unsubThemes = listenToThemes((data) => setThemes(data));

    setLoading(false);

    return () => {
      unsubStories();
      unsubThemes();
    };
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Featured Stories</Text>
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsCard
            title={item.title}
            overview={item.overview}
            onPress={() => navigation.navigate("Story", { story: item })}
          />
        )}
      />

      <Text style={styles.heading}>Top Themes</Text>
      <FlatList
        data={themes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsCard
            title={item.title}
            overview={item.overview}
            onPress={() => navigation.navigate("Theme", { theme: item })}
          />
        )}
      />
    </View>
  );
}

// --- Stories Tab ---
function StoriesScreen({ navigation }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubStories = listenToStories((data) => {
      setStories(data);
      setLoading(false);
    });

    return () => unsubStories();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsCard
            title={item.title}
            overview={item.overview}
            onPress={() => navigation.navigate("Story", { story: item })}
          />
        )}
      />
    </View>
  );
}

// --- Themes Tab ---
function ThemesScreen({ navigation }) {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubThemes = listenToThemes((data) => {
      setThemes(data);
      setLoading(false);
    });

    return () => unsubThemes();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={themes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsCard
            title={item.title}
            overview={item.overview}
            onPress={() => navigation.navigate("Theme", { theme: item })}
          />
        )}
      />
    </View>
  );
}

// --- Navigation ---
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: "Home" }} />
      <Stack.Screen name="Story" component={StoryScreen} />
      <Stack.Screen name="Theme" component={ThemeScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === "Home") iconName = "home";
              else if (route.name === "Stories") iconName = "book-outline";
              else if (route.name === "Themes") iconName = "layers-outline";
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: "#007AFF",
            tabBarInactiveTintColor: "gray",
          })}
        >
          <Tab.Screen name="Home" component={HomeStack} options={{ headerShown: false }} />
          <Tab.Screen name="Stories" component={StoriesScreen} />
          <Tab.Screen name="Themes" component={ThemesScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f5f5f5",
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
});

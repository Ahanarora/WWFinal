// ----------------------------------------
// App.js
// ----------------------------------------
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

// Tabs (list screens)
import HomeScreen from "./screens/HomeScreen";
import StoriesScreen from "./screens/StoriesScreen";
import ThemesScreen from "./screens/ThemesScreen";

// Detail screens
import StoryScreen from "./screens/StoryScreen";
import ThemeScreen from "./screens/ThemeScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#E5E7EB",
          height: 60,
          paddingBottom: 5,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = "ellipse-outline";
          if (route.name === "HomeTab") iconName = "home-outline";
          else if (route.name === "StoriesTab") iconName = "newspaper-outline";
          else if (route.name === "ThemesTab") iconName = "compass-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 12 },
      })}
    >
      {/* 🏠 Home */}
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: "Home" }}
      />

      {/* 📰 Stories */}
      <Tab.Screen
        name="StoriesTab"
        component={StoriesScreen}
        options={{ title: "Stories" }}
      />

      {/* 🧭 Themes */}
      <Tab.Screen
        name="ThemesTab"
        component={ThemesScreen}
        options={{ title: "Themes" }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Tabs as main shell */}
        <Stack.Screen
          name="RootTabs"
          component={Tabs}
          options={{ headerShown: false }}
        />

        {/* Detail pages */}
        <Stack.Screen
          name="Story"
          component={StoryScreen}
          options={{
            title: "Story",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="Theme"
          component={ThemeScreen}
          options={{
            title: "Theme",
            headerBackTitle: "Back",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

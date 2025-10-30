// ----------------------------------------
// App.js
// ----------------------------------------
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts,
  Merriweather_700Bold
} from "@expo-google-fonts/merriweather";
import {
  Inter_400Regular
} from "@expo-google-fonts/inter";

import HomeScreen from "./screens/HomeScreen";
import ThemeScreen from "./screens/ThemeScreen";
import StoriesScreen from "./screens/StoriesScreen";
import StoryScreen from "./screens/StoryScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    "Merriweather-Bold": Merriweather_700Bold,
    "Inter-Regular": Inter_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: "#fafafa" },
          headerTitleStyle: { fontFamily: "Merriweather-Bold", fontSize: 20 },
          headerTintColor: "#111",
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Wait…What?" }} />
        <Stack.Screen name="Theme" component={ThemeScreen} options={{ title: "Theme" }} />
        <Stack.Screen name="Stories" component={StoriesScreen} options={{ title: "Stories" }} />
        <Stack.Screen name="Story" component={StoryScreen} options={{ title: "Story" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import ThemeScreen from './screens/ThemeScreen';
import StoryScreen from './screens/StoryScreen';
import StoriesScreen from './screens/StoriesScreen';
import ThemesScreen from './screens/ThemesScreen';
import { useFonts, Merriweather_700Bold } from '@expo-google-fonts/merriweather';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import AppLoading from 'expo-app-loading';

const [fontsLoaded] = useFonts({
  "Merriweather-Bold": Merriweather_700Bold,
  "Inter-Regular": Inter_400Regular,
});

if (!fontsLoaded) return <AppLoading />;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="Theme" component={ThemeScreen} />
      <Stack.Screen name="Story" component={StoryScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  console.log('✅ App.js mounted successfully');
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeStack} options={{ headerShown: false }} />
        <Tab.Screen name="Stories" component={StoriesScreen} />
        <Tab.Screen name="Themes" component={ThemesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

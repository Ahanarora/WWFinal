import React from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { stories, themes } from './data/dummyData';
import NewsCard from './components/NewsCard';
import StoryScreen from './screens/StoryScreen';
import ThemeScreen from './screens/ThemeScreen';

// --- Home Screen ---
function HomeScreen({ navigation }) {
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
            onPress={() => navigation.navigate('Story', { story: item })}
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
            onPress={() => navigation.navigate('Theme', { theme: item })}
          />
        )}
      />
    </View>
  );
}

// --- Stories Tab ---
function StoriesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsCard
            title={item.title}
            overview={item.overview}
            onPress={() => navigation.navigate('Story', { story: item })}
          />
        )}
      />
    </View>
  );
}

// --- Themes Tab ---
function ThemesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <FlatList
        data={themes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsCard
            title={item.title}
            overview={item.overview}
            onPress={() => navigation.navigate('Theme', { theme: item })}
          />
        )}
      />
    </View>
  );
}

// --- Navigation Setup ---
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="Story" component={StoryScreen} />
      <Stack.Screen name="Theme" component={ThemeScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
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

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
});

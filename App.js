import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { stories, themes } from './data/dummyData';
import NewsCard from './components/NewsCard';

function HomeScreen({ navigation }) {
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
        ListHeaderComponent={<View style={styles.header} />}
      />

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
        ListHeaderComponent={<View style={styles.header} />}
      />
    </View>
  );
}

function StoryScreen({ route }) {
  const { story } = route.params;
  return (
    <View style={styles.detail}>
      <NewsCard title={story.title} overview={story.overview} />
    </View>
  );
}

function ThemeScreen({ route }) {
  const { theme } = route.params;
  return (
    <View style={styles.detail}>
      <NewsCard title={theme.title} overview={theme.overview} />
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Story" component={StoryScreen} />
        <Stack.Screen name="Theme" component={ThemeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginVertical: 10,
  },
  detail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

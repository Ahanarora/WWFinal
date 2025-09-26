import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import NewsCard from '../components/NewsCard';
import { stories, themes } from '../data/dummyData';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsCard
            title={item.title}
            overview={item.overview}
            onPress={() => navigation.navigate('Story', { id: item.id })}
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
            onPress={() => navigation.navigate('Theme', { id: item.id })}
          />
        )}
        ListHeaderComponent={<View style={styles.header} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  header: { marginVertical: 10 },
});

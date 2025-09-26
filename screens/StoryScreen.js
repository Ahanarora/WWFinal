import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import TimelineCard from '../components/TimelineCard';
import AnalysisPanel from '../components/AnalysisPanel';

export default function StoryScreen({ route }) {
  const { story } = route.params;

  if (!story) return <Text>Story not found</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{story.title}</Text>
      <Text style={styles.overview}>{story.overview}</Text>

      <Text style={styles.sectionHeader}>Timeline</Text>
      <FlatList
        data={story.timeline}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <TimelineCard date={item.date} event={item.event} description={item.description} />
        )}
      />

      <Text style={styles.sectionHeader}>Analysis</Text>
      <AnalysisPanel analysis={story.analysis} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  overview: { fontSize: 16, marginBottom: 12 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
});

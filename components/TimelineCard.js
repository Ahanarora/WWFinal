import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TimelineCard({ date, event, description }) {
  return (
    <View style={styles.card}>
      <Text style={styles.date}>{date}</Text>
      <Text style={styles.event}>{event}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  date: { fontSize: 12, color: '#666' },
  event: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  description: { fontSize: 14, marginTop: 2, color: '#444' },
});

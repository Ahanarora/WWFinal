import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function NewsCard({ title, overview, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.overview}>{overview}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  overview: { fontSize: 14, marginTop: 4, color: '#555' },
});

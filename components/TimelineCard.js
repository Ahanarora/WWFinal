//components/TimCard.js//
import { View, Text, StyleSheet } from 'react-native';

export default function TimelineCard({ date, event, description }) {
  return (
    <View style={styles.row}>
      {/* Timeline visuals */}
      <View style={styles.timeline}>
        <View style={styles.dot} />
        <View style={styles.line} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.event}>{event}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 8 },
  timeline: { alignItems: 'center', width: 20 },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#007AFF',
    marginTop: 4,
  },
  line: {
    width: 2, flex: 1, backgroundColor: '#ccc',
    marginTop: 2,
  },
  content: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  date: { fontSize: 12, color: '#666' },
  event: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  description: { fontSize: 14, color: '#444', marginTop: 2 },
});

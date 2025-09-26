import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

function Section({ title, content }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.section}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Text style={styles.title}>
          {title} {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.content}>
          {content.map((item, i) => (
            <Text key={i} style={styles.text}>• {item}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

export default function AnalysisPanel({ analysis }) {
  if (!analysis) return null;

  return (
    <View style={styles.container}>
      <Section title="Stakeholders" content={analysis.stakeholders || []} />
      <Section title="FAQs" content={analysis.faqs || []} />
      <Section title="Future Questions" content={analysis.future || []} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  section: { marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 'bold' },
  content: { marginTop: 6, paddingLeft: 8 },
  text: { fontSize: 14, color: '#333', marginBottom: 4 },
});

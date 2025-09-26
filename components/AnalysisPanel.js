import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// --- Reusable Item (nested dropdown) ---
function Item({ label, detail }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.item}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Text style={styles.itemLabel}>
          {label} {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>
      {expanded && detail && (
        <Text style={styles.itemDetail}>{detail}</Text>
      )}
    </View>
  );
}

// --- Section (Stakeholders / FAQs / Future) ---
function Section({ title, content }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.section}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Text style={styles.sectionTitle}>
          {title} {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.sectionContent}>
          {content.map((item, i) =>
            typeof item === 'string' ? (
              // If it's a simple string (no detail), just show as bullet
              <Text key={i} style={styles.simpleText}>• {item}</Text>
            ) : (
              // If it's an object with label + detail
              <Item key={i} label={item.question || item.name} detail={item.answer || item.detail} />
            )
          )}
        </View>
      )}
    </View>
  );
}

// --- Main Panel ---
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
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  sectionContent: { marginTop: 6, paddingLeft: 8 },
  simpleText: { fontSize: 14, color: '#333', marginBottom: 4 },

  item: { marginVertical: 6 },
  itemLabel: { fontSize: 14, fontWeight: '600', color: '#444' },
  itemDetail: { fontSize: 13, color: '#666', marginTop: 4, paddingLeft: 12 },
});

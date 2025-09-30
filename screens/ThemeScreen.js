import React from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  Image,
  Linking,
} from "react-native";
import { List } from "react-native-paper";

export default function ThemeScreen({ route }) {
  const { theme } = route.params;

  if (!theme) {
    return (
      <View style={styles.container}>
        <Text>No theme data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Title & Overview */}
      <Text style={styles.title}>{theme.title}</Text>
      <Text style={styles.overview}>{theme.overview}</Text>

      {/* Timeline */}
      {theme.timeline && theme.timeline.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.heading}>Timeline</Text>
          <FlatList
            data={theme.timeline}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={styles.event}>{item.event}</Text>
                <Text>{item.description}</Text>

                {/* Show image if available */}
                {item.imageUrl && (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                )}

                {/* Show link if available */}
                {item.sourceLink && (
                  <Text
                    style={styles.link}
                    onPress={() => Linking.openURL(item.sourceLink)}
                  >
                    Read more →
                  </Text>
                )}
              </View>
            )}
          />
        </View>
      )}

      {/* Analysis */}
      {theme.analysis && (
        <View style={styles.section}>
          <Text style={styles.heading}>Analysis</Text>
          <List.Section>
            {/* Stakeholders */}
            <List.Accordion
              title="Stakeholders"
              left={(props) => <List.Icon {...props} icon="account-group" />}
            >
              {theme.analysis?.stakeholders?.map((s, i) => (
                <List.Item key={i} title={s.name} description={s.detail} />
              ))}
            </List.Accordion>

            {/* FAQs */}
            <List.Accordion
              title="FAQs"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
            >
              <List.AccordionGroup>
                {theme.analysis?.faqs?.map((f, i) => (
                  <List.Accordion
                    key={i}
                    id={`faq-${i}`}
                    title={`Q: ${f.question}`}
                    left={(props) => <List.Icon {...props} icon="comment-question" />}
                  >
                    <List.Item title={`A: ${f.answer}`} />
                  </List.Accordion>
                ))}
              </List.AccordionGroup>
            </List.Accordion>

            {/* Future Outlook */}
            <List.Accordion
              title="Future Outlook"
              left={(props) => <List.Icon {...props} icon="trending-up" />}
            >
              {theme.analysis?.future?.map((f, i) => (
                <List.Item
                  key={i}
                  title={`Q: ${f.question}`}
                  description={`A: ${f.answer}`}
                />
              ))}
            </List.Accordion>
          </List.Section>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  overview: { fontSize: 16, marginBottom: 20, color: "#333" },
  section: { marginBottom: 20 },
  heading: { fontSize: 18, fontWeight: "600", marginBottom: 8, color: "#007AFF" },
  card: {
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
  date: { fontWeight: "bold", marginBottom: 4 },
  event: { fontSize: 16, fontWeight: "500", marginBottom: 2 },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginTop: 8,
  },
  link: {
    marginTop: 6,
    color: "#007AFF",
    fontWeight: "600",
  },
});

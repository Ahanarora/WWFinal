//screens/WhatIsWaitWhatScreen.js//

import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { colors, fonts, spacing } from "../styles/theme";

const Bullet = ({ children }) => (
  <Text style={styles.bullet}>• <Text style={styles.body}>{children}</Text></Text>
);

export default function WhatIsWaitWhatScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>WHAT IS WAIT…WHAT?</Text>
      <Text style={styles.title}>A Modern News Experience Designed for Clarity.</Text>
      <Text style={styles.body}>
        Wait…What? is a structured, intelligent way to understand the world. Instead of navigating
        scattered articles, you get clear, evolving storylines for the major themes shaping news
        today—elections, geopolitics, policy, markets, technology, and more. Our goal is simple: to
        turn chaos into comprehension.
      </Text>

      <Text style={styles.sectionTitle}>WHY WE BUILT THIS</Text>
      <Text style={styles.body}>
        News today moves fast, fragments across outlets, and rarely connects into a coherent
        picture. People don’t struggle with a lack of information; they struggle with the lack of
        structure.
      </Text>
      <Text style={styles.body}>
        Traditional news feeds are designed around urgency. Wait…What? is designed around
        understanding.
      </Text>
      <Text style={styles.body}>We replace noise with a system built for clarity:</Text>
      <Bullet>Themes instead of isolated articles</Bullet>
      <Bullet>Timelines instead of endless feeds</Bullet>
      <Bullet>Context instead of jargon</Bullet>
      <Bullet>Analysis instead of speculation</Bullet>
      <Bullet>Transparent verification instead of blind trust</Bullet>
      <Text style={styles.body}>
        The result is a calm, clear, and connected view of the world.
      </Text>

      <Text style={styles.sectionTitle}>OUR METHOD</Text>
      <Text style={styles.subtitle}>A System for Making Sense of News.</Text>
      <Text style={styles.body}>
        Wait…What? operates on a structured methodology. Every major story is broken down into
        layers that together give you a complete and comprehensible view of events.
      </Text>
      <View style={styles.stepCard}>
        <Text style={styles.stepHeading}>1. Themes</Text>
        <Text style={styles.body}>
          We track significant ongoing topics—wars, elections, policies, crises, markets,
          technology shifts. Each theme is a living page that collects every relevant development in
          one place.
        </Text>
      </View>
      <View style={styles.stepCard}>
        <Text style={styles.stepHeading}>2. Events</Text>
        <Text style={styles.body}>
          Every update becomes an event card arranged chronologically. This lets you follow a story
          from its origins or jump straight to the latest development without confusion.
        </Text>
      </View>
      <View style={styles.stepCard}>
        <Text style={styles.stepHeading}>3. Context</Text>
        <Text style={styles.body}>
          Every event includes built-in background: definitions, actors, history, previous
          decisions, and explanations of why each update matters. If something is unclear, you can
          tap it for a deeper explainer.
        </Text>
      </View>
      <View style={styles.stepCard}>
        <Text style={styles.stepHeading}>4. Analysis</Text>
        <Text style={styles.body}>
          Themes include longer-form structure: stakeholder incentives, future scenarios, FAQs,
          broader trends, and comparisons. This turns raw updates into meaningful insight.
        </Text>
      </View>
      <View style={styles.stepCard}>
        <Text style={styles.stepHeading}>5. Confidence Score</Text>
        <Text style={styles.body}>
          Each event includes a confidence score that reflects the number of sources reporting it,
          the credibility of those sources, and agreement across outlets. You see immediately how
          solid each claim is.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>OUR USE OF AI</Text>
      <Text style={styles.subtitle}>Full Transparency on How Content Is Created.</Text>
      <Text style={styles.body}>
        Wait…What? uses AI as a core part of how content is generated, structured, and updated. We
        believe in being fully honest and clear about this.
      </Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Most content is AI-generated.</Text> Timelines, summaries,
        explainers, FAQs, and analysis are primarily produced by AI models that synthesize verified
        reporting across multiple reputable sources. This gives us speed, structure, and
        consistency.
      </Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Everything includes human oversight.</Text> Human editors review,
        correct, and refine all major themes and events. Humans ensure accuracy, identify weaknesses
        in AI summaries, and make editorial decisions about what to include and how to frame it. AI
        creates the first draft. Humans make sure it is correct, fair, and readable.
      </Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Facts come from real reporting.</Text> AI is never instructed to
        invent facts. All claims originate from established news organizations, official statements,
        verified data sources, and reputable international agencies. AI consolidates and organizes;
        it does not originate news.
      </Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>What AI does not do.</Text> AI does not create fictional events,
        predict outcomes as facts, or steer editorial direction. It does not replace source-based
        reporting or impartial judgment.
      </Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Why we use AI.</Text> Using AI helps us deliver faster updates,
        cleaner structure, comprehensive timelines, and consistently clear explanations. But speed
        never replaces responsibility. Human oversight remains essential at every stage.
      </Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Your interactions remain private.</Text> Questions you ask inside
        the app are not used to train models and are not shared externally. Your interactions stay
        private within Wait…What?.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  kicker: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bullet: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: spacing.xs,
  },
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  stepHeading: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.textPrimary,
  },
  bold: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.textPrimary,
  },
});

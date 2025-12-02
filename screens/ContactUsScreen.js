//screens/ContactUsScreen.js//

import React from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { colors, fonts, spacing } from "../styles/theme";

const CONTACT_EMAIL = "hello@waitwhat.app";

export default function ContactUsScreen() {
  const openEmail = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Contact Us</Text>
      <Text style={styles.body}>
        Questions, feedback, or partnership ideas? We’d love to hear from you. Reach out anytime and
        we’ll get back as quickly as we can.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Email</Text>
        <Text style={styles.body}>Send us a note and we’ll respond within one business day.</Text>
        <TouchableOpacity onPress={openEmail} style={styles.cta}>
          <Text style={styles.ctaText}>{CONTACT_EMAIL}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Product feedback</Text>
        <Text style={styles.body}>
          Tell us what’s working, what’s confusing, and what you’d like to see next. Your input helps
          shape Wait…What?.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Press & partnerships</Text>
        <Text style={styles.body}>
          For media inquiries, collaborations, or integrations, drop us a line and we’ll follow up.
        </Text>
      </View>
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
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  cardTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.textPrimary,
  },
  cta: {
    marginTop: spacing.xs,
  },
  ctaText: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: "#2563EB",
  },
});

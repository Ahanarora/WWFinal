//components/ShareButton.js//
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ShareButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Ionicons name="share-outline" size={22} color="#4B5563" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 6,
    borderRadius: 8,
  },
});

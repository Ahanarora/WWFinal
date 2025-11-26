import { Share } from "react-native";

export async function shareItem({ type, id, title }) {
  try {
    const url = `https://waitwhat.app/${type}/${id}`; 
    // OR use deep link: wwfinal://story/123

    const message = `${title}\n\nRead on Wait...What?\n${url}`;

    await Share.share({
      title,
      message,
      url
    });
  } catch (error) {
    console.error("Share failed:", error);
  }
}

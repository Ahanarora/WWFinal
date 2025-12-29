//utils/share.js

import { Share } from "react-native";
import { track } from "./analytics";

export async function shareItem({ type, id, title }) {
  try {
    const url = `https://waitwhat.app/${type}/${id}`; 
    // OR use deep link: wwfinal://story/123

    const message = `${title}\n\nRead on Wait...What?\n${url}`;

    const result = await Share.share({
      title,
      message,
      url
    });
    if (result?.action === Share.sharedAction) {
      track("share", { type, id });
    }
  } catch (error) {
    console.error("Share failed:", error);
  }
}


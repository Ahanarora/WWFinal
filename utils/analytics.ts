import * as Analytics from "expo-firebase-analytics";

export const track = async (
  event: string,
  params?: Record<string, string | number | boolean>
) => {
  try {
    console.log("[analytics]", event, params ?? {});
    await Analytics.logEvent(event, params ?? {});
  } catch (e) {
    console.warn("[analytics error]", e);
  }
};

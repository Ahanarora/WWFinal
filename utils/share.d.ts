export type SharePayload = {
  type: "story" | "theme";
  id: string;
  title?: string;
};

export function shareItem(payload: SharePayload): Promise<void>;

import NetInfo from "@react-native-community/netinfo";

export const checkOnline = async () => {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected);
};

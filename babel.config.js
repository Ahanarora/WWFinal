// babel.config.js — root Babel config
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"], // ✅ needed for animations & gestures
  };
};

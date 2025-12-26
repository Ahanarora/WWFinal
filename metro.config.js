const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// OPTIONAL: only keep this if you actually need monorepo support
// config.watchFolders = ["../packages"];

module.exports = config;

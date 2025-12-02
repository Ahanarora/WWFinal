// utils/storyCache.js — in-memory cache for story search
let cachedStories = [];

export function setStorySearchCache(stories) {
  if (Array.isArray(stories)) {
    cachedStories = stories;
  } else {
    cachedStories = [];
  }
}

export function getStorySearchCache() {
  return cachedStories;
}

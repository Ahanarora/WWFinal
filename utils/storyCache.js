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

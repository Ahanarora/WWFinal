// src/navigation/types.ts

export type RootStackParamList = {
  Login: undefined;

  RootTabs: undefined;

  Story: { storyId: string };
  Theme: { themeId: string };

  EventReader: {
    storyId?: string;
    themeId?: string;
    initialIndex?: number;
  };

  AnalysisModal: {
    title: string;
    content: string;
    factCheck?: unknown;
  };

  Search: {
    query?: string;
  };

  WhatIsWaitWhat: undefined;
  ContactUs: undefined;
};

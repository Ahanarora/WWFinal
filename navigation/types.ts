export type RootStackParamList = {
  Login: undefined;

  RootTabs: undefined;

  Story: { storyId: string };
  Theme: { themeId: string };

  Search: { query?: string };

  AnalysisModal: {
    title: string;
    content: string;
    factCheck?: unknown;
  };

  EventReader: {
    storyId?: string;
    themeId?: string;
    initialIndex?: number;
  };

  WhatIsWaitWhat: undefined;
  ContactUs: undefined;
};

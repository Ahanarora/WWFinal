import type { TimelineEventBlock } from "@ww/shared";

export type RootStackParamList = {
  Login: undefined;
  RootTabs: undefined;

  Story: { id: string };
  Theme: { id: string };

  Search: { query: string };

  AnalysisModal: {
    // whatever you already have
  };

  EventReader: {
    events: TimelineEventBlock[];
    initialIndex?: number;
  };

  WhatIsWaitWhat: undefined;
  ContactUs: undefined;
};

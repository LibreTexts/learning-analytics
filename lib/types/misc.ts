export type AnalyticsAPIResponse<T> = {
  data: T;
  error?: string;
};

export type IDWithName = { id: string; name: string };

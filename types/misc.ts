import React from "react";

export interface ActionResult {
  error: string | null;
}

export type AnalyticsAPIResponse<T> = {
  data: T;
  error?: string;
};

export type IDWithName = { id: string; name: string };
export type IDWithText<T extends string | number = string> = {
  id: T;
  text: string;
};

export type Student = {
  id: string;
  email: string;
  name: string;
};

export type ADAPT_CourseScoresAPIResponse = {
  body: string[][];
};

export type ArrayElement<A> = A extends (infer T)[] ? T : never;

export type VisualizationBaseProps<T> = {
  width?: number;
  height?: number;
  tableView?: boolean;
  innerRef?: React.RefObject<VisualizationInnerRef>;
  data: T;
};

export type VisualizationInnerRef = {
  getSVG: () => SVGSVGElement | null;
};

export type ADAPTLoginJWT = {
  id: string;
  role: 2 | 3;
  course_id: number;
};

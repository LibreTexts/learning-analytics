import { ZodError, z } from "zod";

export type AnalyticsAPIResponse<T> = {
  data: T;
  error?: string;
};

export type IDWithName = { id: string; name: string };
export type IDWithText<T extends string | number = string> = {
  id: T;
  text: string;
};

export type ADAPT_CourseScoresAPIResponse = {
  body: string[][];
};

export type ArrayElement<A> = A extends (infer T)[] ? T : never;

export type VisualizationBaseProps = {
  width?: number;
  height?: number;
  tableView?: boolean;
  innerRef?: React.RefObject<VisualizationInnerRef>;
};

export type VisualizationInnerRef = {
  getSVG: () => SVGSVGElement | null;
};

export type ZodSafeParseResult<T extends z.ZodTypeAny> =
  | { success: true; data: z.infer<T> }
  | { success: false; error: ZodError };

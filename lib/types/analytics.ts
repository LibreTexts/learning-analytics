import { IDWithName } from "./misc";

export type AssignmentAvgScoreCalc = {
  _id: string;
  avg_score: number;
};

export type SubmissionTimeline = {
  _id: string;
  count: number;
  parsedDue: Date;
};

export type PerformancePerAssignment = {
  assignment_id: string;
  student_score: number;
  class_avg: number;
};

export type TextbookInteractionsCount = {
  date: string;
  numInteractions: number;
};

export type InstructorQuickMetrics = {
  assignments: number;
  enrolled: number;
};

export type StudentQuickMetrics = {
  textbookEngagement: number;
  assignmentsCount: number;
  averageScore: number;
};

export type ActivityAccessed = {
  seen: IDWithName[];
  unseen: IDWithName[];
  course_avg_percent_seen: number;
};

export type AnalyticsRawData = {
  actor_id: string;
  name: string;
  pagesAccessed: number;
  uniqueInteractionDays: number;
  avgPercentAssignment: number;
  percentSeen: number;
  coursePercent: number;
  classPercentile: number;
  classQuartile: number;
};
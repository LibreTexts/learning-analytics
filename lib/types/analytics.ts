import { IDWithName, IDWithText } from "./misc";

export type AssignmentAvgScoreCalc = {
  _id: string;
  avg_score: number;
};

export type SubmissionTimeline = {
  question_id: string;
  data: { date: string; count: number }[];
};

export type PerformancePerAssignment = {
  assignment_id: string;
  student_score: number;
  class_avg: number;
};

export type GradeDistribution = {
  grades: string[];
  letter_grades_released: boolean;
};

export type TextbookInteractionsCount = {
  date: string;
  numInteractions: number;
};

export type InstructorQuickMetrics = {
  assignments: number;
  enrolled: number;
  totalQuestions: number;
  totalPageViews?: number;
};

export type StudentQuickMetrics = {
  textbookEngagement: number;
  assignmentsCount: number;
  averageScore: number;
};

export type ActivityAccessed = {
  seen: number[];
  unseen: number[];
  course_avg_percent_seen: number;
};

export type AnalyticsRawData = {
  actor_id: string;
  name: string;
  pagesAccessed: number;
  uniqueInteractionDays: number;
  percentSeen: number;
  coursePercent: number;
  classPercentile: number;
  classQuartile: number;
};

export type FrameworkData = {
  framework_descriptors: IDWithText<number>[];
  framework_levels: IDWithText<number>[];
};

export type FrameworkAlignment = FrameworkData & {
  assignment_id: number;
  question_id: number;
};

export type TimeInReview = {
  question_id: number;
  student_time: number;
  course_avg: number;
};

export type TimeOnTask = {
  question_id: number;
  student_time: number;
  course_avg: number;
};

export type LOCData = {
  framework_level: {
    id: string;
    text: string;
    question_count: number;
    avg_performance: number;
  };
  framework_descriptors: {
    id: string;
    text: string;
    question_count: number;
    avg_performance: number
  }[];
};

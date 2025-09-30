import { IDWithText } from "./misc.js";

export type AssignmentAvgScoreCalc = {
  _id: string;
  avg_score: number;
};

export type SubmissionTimeline = {
  assignment_id: string;
  due_date: Date | null;
  final_submission_deadline: Date | null;
  questions: {
    question_id: string;
    data: {
      date: string;
      count: number;
    }[];
  }[];
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
  assignment_id: string;
  seen: number[];
  unseen: number[];
  course_avg_seen: number;
  course_avg_unseen: number;
};

export type AnalyticsRawData = {
  actor_id: string;
  name: string;
  pages_accessed?: number;
  unique_interaction_days?: number;
  not_submitted: number;
  submitted: number;
  avg_time_on_task: number;
  avg_time_in_review: number;
  course_percent: number;
  class_quartile: number;
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
    questions: string[];
    question_count: number;
    avg_performance: number;
  };
  framework_descriptors: {
    id: string;
    text: string;
    questions: string[];
    question_count: number;
    avg_performance: number;
  }[];
};

export type LearningCurveDescriptor = {
  id: string;
  text: string;
  questions: string[];
  question_count: number;
}

export type LearningCurveRawScoreData = {
  question_id: string;
  score: number;
  max_score: number;
  last_submitted_at: string;
};

export type LearningCurveRawScoreDataWPercent = LearningCurveRawScoreData & {
  percent_correct: number;
};

export type LearningCurveRawData = {
  descriptor: LearningCurveDescriptor;
  score_data: LearningCurveRawScoreData[];
};

export type LearningCurveRawDataWPercent = Pick<LearningCurveRawData, "descriptor"> & {
  score_data: LearningCurveRawScoreDataWPercent[];
};

export type LearningCurveData = Pick<LearningCurveRawData, "descriptor"> & {
  score_data: {
    submission_date: string;
    avg_percent: number;
  }[];
};

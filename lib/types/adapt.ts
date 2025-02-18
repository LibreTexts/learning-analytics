import { IDWithText } from "./misc";

// Assignments

export type ADAPTAssignTo = {
  available_from: string;
  due: string;
  final_submission_deadline: string;
  groups: string[];
};

export type ADAPTCourseAssignment = {
  id: number;
  name: string;
  num_questions: number;
  assign_tos: ADAPTAssignTo[];
};

export type ADAPTCourseAssignmentsRes = {
  type: string;
  assignments: ADAPTCourseAssignment[];
};

// Enrollments
export type ADAPTCourseEnrollment = {
  id: number;
  name: string;
  email: string;
  section: string;
  student_id: string;
  section_id: number;
  enrollment_date: string;
};

export type ADAPTEnrollmentDetailsRes = {
  type: string;
  sections: { text: string; value: number }[];
  enrollments: ADAPTCourseEnrollment[];
};

// Scores
export type ADAPTAssignmentQuestionField = {
  key: string;
  label: string;
  isRowHeader: boolean;
};
export type ADAPTQuestionScoreData = {
  name: string;
  percent_correct: string;
  total_points: string;
  userId: string;
  [key: string]: string;
};

export type ADAPTAssignmentScoresRes = {
  type: string;
  rows: ADAPTQuestionScoreData[];
  fields: ADAPTAssignmentQuestionField[];
};

// Auto Graded Submissions
export type ADAPTAutoGradedSubmissionData = {
  question_id: number;
  user_id: number;
  name: string;
  email: string;
  score: number;
  submission_count: number;
};

export type ADAPTAutoGradedSubmissionRes = {
  type: string;
  auto_graded_submission_info_by_user: ADAPTAutoGradedSubmissionData[];
};

// Submission Timestamps

export type ADAPTSubmissionTimestampData = {
  user_id: number;
  auto_graded: {
    [key: string]: {
      first_submitted_at: string;
      last_submitted_at: string;
    };
  };
};

export type ADAPTSubmissionTimestampDataRes = ADAPTSubmissionTimestampData[];

// Review Time
export type ADAPTReviewTimeData = {
  email: string;
  assignment_id: number;
  question_id: number;
  created_at: string;
  updated_at: string;
};

export type ADAPTReviewTimeResponse = {
  type: string;
  review_histories: ADAPTReviewTimeData[];
};

// Frameworks
export type ADAPTFramework = {
  id: number;
  title: string;
  description: string;
};

export type ADAPTFrameworksRes = {
  type: string;
  frameworks: ADAPTFramework[];
};

export type ADAPTFrameworkLevel = {
  id: number;
  framework_id: number;
  level: number;
  title: string;
  description: string | null;
  order: number;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
};

export type ADAPTFrameworkDescriptor = {
  id: number;
  descriptor: string;
  framework_level_id: number;
};

export type ADAPTFrameworkRes = {
  type: string;
  properties: ADAPTFramework;
  framework_levels: ADAPTFrameworkLevel[];
  descriptors: ADAPTFrameworkDescriptor[];
};

export type ADAPTFrameworkQuestionSync = {
  descriptors: IDWithText<number>[];
  levels: IDWithText<number>[];
};

export type ADAPTFrameworkQuestionSyncRes = {
  type: string;
  framework_item_sync_question: ADAPTFrameworkQuestionSync;
};

// Misc
export type ADAPTAutoLoginRes = {
  type: string;
  token: string;
};

export type ADAPTMiniSummaryRes = {
  type: string;
  "mini-summary": {
    name: string;
    user_id: string;
    start_date: string;
    end_date: string;
    textbook_url: string;
  };
};

export type ADAPTFrameworkSyncWebhookData =
  | {
      type: "success";
      results: {
        question_id: number;
        descriptors_levels: {
          descriptors: IDWithText<number>[];
          levels: IDWithText<number>[];
        };
      }[];
    }
  | { type: "error"; message: string };

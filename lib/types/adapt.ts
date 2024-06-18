export type ADAPTReviewTimeResponse = {
  email: string;
  assignment_id: number;
  question_id: number;
  created_at: string;
  updated_at: string;
};

export type ADAPTAutoLoginRes = {
  type: string;
  token: string;
};

export type ADAPTCourseAssignment = {
  id: number;
  name: string;
  num_questions: number;
};

export type ADAPTCourseEnrollment = {
  id: number;
  name: string;
  email: string;
  section: string;
  student_id: string;
  section_id: number;
  enrollment_date: string;
};

export type ADAPTQuestionScoreData = {
  name: string;
  percent_correct: string;
  total_points: string;
  userId: string;
  [key: string]: string;
}

export type ADAPTCourseAssignmentsRes = {
  type: string;
  assignments: ADAPTCourseAssignment[];
};

export type ADAPTEnrollmentDetailsRes = {
  type: string;
  sections: { text: string; value: number }[];
  enrollments: ADAPTCourseEnrollment[];
};

export type ADAPTAssignmentScoresRes = {
  type: string;
  rows: ADAPTQuestionScoreData[];
}

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

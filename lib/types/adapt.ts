export type ADAPTEnrollmentsResponse = {
  email: string;
  class: string;
  created_at: string;
};

export type ADAPTReviewTimeResponse = {
  email: string;
  assignment_id: number;
  question_id: number;
  created_at: string;
  updated_at: string;
};

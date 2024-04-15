export type AssignmentAvgScoreCalc = {
  _id: string;
  avg_score: number;
};

export type SubmissionTimeline = {
  _id: string;
  count: number;
  parsedDue: Date
}

export type PerformancePerAssignment = {
  assignment_id: string;
  student_score: number;
  class_avg: number;
}
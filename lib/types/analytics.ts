export type AssignmentAvgScoreCalc = {
  _id: string;
  avg_score: number;
};

export type SubmissionTimeline = {
  _id: string;
  count: number;
  parsedDue: Date
}
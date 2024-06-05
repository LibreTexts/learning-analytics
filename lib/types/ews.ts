export type EarlyWarningStatus =
  | "success" // no students at-risk
  | "danger" // more than 15% of students at-risk
  | "warning" // 1-15% of students at-risk
  | "insufficient-data" // not enough data to make a prediction
  | "error"; // error occurred while fetching data

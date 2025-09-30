export type EarlyWarningStatus =
  | "success" // no students at-risk
  | "danger" // more than 15% of students at-risk
  | "warning" // 1-15% of students at-risk
  | "insufficient-data" // not enough data to make a prediction
  | "error"; // error occurred while fetching data

export type EWSResult = {
  student_id: string;
  name: string;
  estimated_final: number;
  course_avg_diff: number;
  z_score: number;
  status: EarlyWarningStatus;
  course_avg: number;
  course_std_dev: number;
};

export type BatchPredictWebhookData =
  | {
      state: "error";
      course_id: string;
    }
  | {
      state: "success";
      course_id: string;
      predictions: {
        [x: string]: number;
      };
    };

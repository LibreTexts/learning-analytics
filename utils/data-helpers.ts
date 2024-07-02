import crypto from "crypto";
import { isGeneratorFunction } from "util/types";

const ALGO = "aes-256-cbc";
const KEY = process.env.STUDENT_ENCRYPTION_KEY;

export async function decryptStudent(student: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      if (!student) {
        reject(new Error("No student data provided."));
        return;
      }
      if (!KEY) {
        reject(new Error("No encryption key provided."));
        return;
      }

      const iv = Buffer.from(KEY, "hex");

      const decipher = crypto.createDecipheriv(ALGO, KEY, iv);

      let decrypted = "";
      decipher.on("readable", () => {
        let chunk;
        while (null !== (chunk = decipher.read())) {
          decrypted += chunk.toString("utf8");
        }
      });

      decipher.write(student, "hex");
      decipher.end();

      decipher.on("end", () => {
        resolve(decrypted);
      });
      decipher.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function encryptStudent(student: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      if (!student) {
        reject(new Error("No student data provided."));
        return;
      }
      if (!KEY) {
        reject(new Error("No encryption key provided."));
        return;
      }

      const iv = Buffer.from(KEY, "hex");
      const cipher = crypto.createCipheriv(ALGO, KEY, iv);

      let encrypted = cipher.update(student, "utf8", "hex");
      encrypted += cipher.final("hex");

      resolve(encrypted);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Keys of the ADAPTQuestionScoreData object that are not question id's
 **/
export const QUESTION_SCORE_DATA_EXCLUSIONS = [
  "name",
  "percent_correct",
  "total_points",
  "userId",
  "override_score",
];

export function mmssToSeconds(mmss: string): number {
  if (!mmss) return 0;
  if (typeof mmss !== "string") return 0;
  if (!mmss.includes(":")) return 0;

  const parts = mmss.split(":");

  if (parts.length !== 2) {
    return 0; // Invalid format
  }

  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);

  if (isNaN(minutes) || isNaN(seconds)) {
    return 0; // Invalid number conversion
  }

  return minutes * 60 + seconds;
}

export const Assignments_AllCourseQuestionsAggregation = [
  {
    $unwind: "$questions",
  },
  {
    $group: {
      _id: "$course_id",
      unique_questions: {
        $addToSet: "$questions",
      },
    },
  },
  {
    $project: {
      course_id: "$_id",
      unique_questions: 1,
      _id: 0,
    },
  },
];

/**
 * Takes an array of objects and returns a new array with outliers removed based on the specified key
 * @param data - The data to remove outliers from (array of objects)
 * @param key - The key to use for outlier detection
 * @param upperOnly - Whether to remove only upper outliers, or both upper and lower outliers
 * @returns - The data with outliers removed
 */
export function removeOutliers<T extends { [key: string]: any }>(
  data: T[],
  key: keyof T,
  upperOnly = false
): T[] {
  // Helper function to calculate the percentile
  function percentile(arr: number[], p: number): number {
    const sortedArr = arr.slice().sort((a, b) => a - b);
    const index = (p / 100) * (sortedArr.length - 1);
    const lowerIndex = Math.floor(index);
    const upperIndex = lowerIndex + 1;
    const weight = index % 1;

    if (upperIndex >= sortedArr.length) {
      return sortedArr[lowerIndex];
    }

    return (
      sortedArr[lowerIndex] * (1 - weight) + sortedArr[upperIndex] * weight
    );
  }

  // Extract the values based on the specified key
  const values = data.map((item) => item[key]);

  // Calculate Q1 and Q3
  const Q1 = percentile(values, 25);
  const Q3 = percentile(values, 75);

  // Calculate IQR
  const IQR = Q3 - Q1;

  // Define outlier bounds
  const lowerBound = Q1 - 1.5 * IQR;
  const upperBound = Q3 + 1.5 * IQR;

  // Filter out the outliers
  const filteredData = data.filter((item) => {
    const value = item[key];
    return upperOnly
      ? value <= upperBound
      : value >= lowerBound && value <= upperBound;
  });

  return filteredData;
}

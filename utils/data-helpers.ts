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
  if(!mmss) return 0;
  if(typeof mmss !== 'string') return 0;
  if(!mmss.includes(':')) return 0;

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

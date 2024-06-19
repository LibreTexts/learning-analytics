import crypto from "crypto";

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
  'name',
  'percent_correct',
  'total_points',
  'userId',
  'override_score'
]

import crypto from "crypto";

export async function decryptStudent(student: string): Promise<string> {
  if (!student) throw new Error("No student data provided.");

  const ALGO = "aes-256-cbc";
  const KEY = process.env.STUDENT_ENCRYPTION_KEY;
  if (!KEY) throw new Error("No encryption key provided.");

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

  return new Promise((resolve, reject) => {
    decipher.on("end", () => {
      resolve(decrypted);
    });
    decipher.on("error", (err) => {
      reject(err);
    });
  });
}

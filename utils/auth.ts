import user, { IUser } from "@/lib/models/user";
import bcrypt from "bcryptjs";

export const hashPassword = async (password: string) => {
  try {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const verifyPassword = async (
  rawInputPassword: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(rawInputPassword, hashedPassword);
};

export const getUser = async (email: string): Promise<IUser | null> => {
  try {
    const found = await user.findOne({ email });
    return found;
  } catch (err) {
    console.error(err);
    return null;
  }
};

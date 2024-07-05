import axios from "axios";
import * as jose from "jose";

const useEWSAxios = async () => {
  const generateJWT = async () => {
    const signingKey = process.env.EWS_API_KEY;
    if (!signingKey) return null;

    const secret = new TextEncoder().encode(signingKey);

    return await new jose.SignJWT({
      iss: "learning-analytics-api",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("30m")
      .sign(secret);
  };

  const bearer = await generateJWT();
  if (!bearer) return null;
  
  const axiosInstance = axios.create({
    baseURL: process.env.EWS_API_BASE_URL,
    headers: {
      Authorization: `Bearer ${bearer}`,
    },
  });

  return axiosInstance;
};

export default useEWSAxios;

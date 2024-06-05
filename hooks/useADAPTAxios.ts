import axios from "axios";

const useADAPTAxios = (token?: string) => {
  const bearer = token || process.env.ADAPT_API_KEY;
  const axiosInstance = axios.create({
    baseURL: process.env.ADAPT_API_BASE_URL,
    headers: {
      Authorization: `Bearer ${bearer}`,
    },
  });

  return axiosInstance;
};

export default useADAPTAxios;
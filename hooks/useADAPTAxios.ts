import axios from "axios";

const useADAPTAxios = () => {
  const axiosInstance = axios.create({
    baseURL: process.env.ADAPT_API_BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.ADAPT_API_KEY}`,
    },
  });

  return axiosInstance;
};

export default useADAPTAxios;
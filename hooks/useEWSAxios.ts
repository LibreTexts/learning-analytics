import axios from "axios";

const useEWSAxios = () => {
  const bearer = "";
  const axiosInstance = axios.create({
    baseURL: process.env.EWS_API_BASE_URL,
    headers: {
      Authorization: `Bearer ${bearer}`,
    },
  });

  return axiosInstance;
};

export default useEWSAxios;

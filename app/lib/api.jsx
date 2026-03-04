import axios from "axios";

const axios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GOLANG_URL,
  withCredentials: true, // cukup sekali di sini
});

export default axios;

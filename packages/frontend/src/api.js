import axios from "axios";
export const api = axios.create({
  baseURL: (
    process.env.REACT_APP_API_URL || "http://localhost:8000/api"
  ).replace(/\/$/, ""),
  timeout: 15000,
});
api.interceptors.response.use(
  (r) => r.data,
  (e) =>
    Promise.reject(
      new Error(
        e.response?.data?.error ||
          e.response?.data?.message ||
          "No se pudo completar la solicitud. Verificá el backend y MongoDB.",
      ),
    ),
);
export const idOf = (x) => x?.id || x?._id;

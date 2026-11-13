import axios from "axios";
export const api = axios.create({
  baseURL: (
    process.env.REACT_APP_API_URL || "http://localhost:8000/api"
  ).replace(/\/$/, ""),
  timeout: 15000,
  withCredentials: true,
});
api.interceptors.response.use(
  (r) => r.data,
  (e) => {
    if (
      e.response?.status === 401 &&
      !e.config?.url?.startsWith("/auth/") &&
      !e.config?.url?.startsWith("/admin/") &&
      e.config?.url !== "/habilidades"
    )
      window.dispatchEvent(new Event("sesion-expirada"));
    const error = new Error(
      e.response?.data?.error ||
        e.response?.data?.message ||
        "No se pudo completar la solicitud. Verificá el backend y MongoDB.",
    );
    error.status = e.response?.status;
    return Promise.reject(error);
  },
);
export const idOf = (x) => x?.id || x?._id;

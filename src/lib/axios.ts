import axios from "axios";
import { getAccessToken, setAccessToken } from "@/lib/authToken";
import { clearUser } from "@/utils/storage";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // BFF reads the httpOnly refresh cookie and returns a fresh access token.
        const r = await fetch("/api/auth/refresh", { method: "POST" });
        if (!r.ok) throw new Error("refresh failed");
        const { access } = await r.json();
        setAccessToken(access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        clearUser();
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

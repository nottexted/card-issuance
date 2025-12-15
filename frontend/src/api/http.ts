import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const http = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

function normalizeErrorMessage(detail: any): string {
  if (!detail) return "Ошибка запроса";
  if (typeof detail === "string") return detail;

  // FastAPI / Pydantic validation errors often come as list[{loc,msg,type}]
  if (Array.isArray(detail)) {
    const lines = detail
      .map((e) => {
        const loc = Array.isArray(e?.loc) ? e.loc.join(".") : e?.loc;
        const msg = e?.msg || e?.message || String(e);
        return loc ? `${loc}: ${msg}` : msg;
      })
      .filter(Boolean);
    return lines.length ? lines.join("\n") : "Ошибка валидации";
  }

  if (typeof detail === "object") {
    try {
      return JSON.stringify(detail);
    } catch {
      return "Ошибка запроса";
    }
  }

  return String(detail);
}

http.interceptors.response.use(
  (r) => r,
  (err) => {
    const detail = err?.response?.data?.detail ?? err?.response?.data?.message ?? err?.message;
    const msg = normalizeErrorMessage(detail);
    return Promise.reject(new Error(msg));
  }
);

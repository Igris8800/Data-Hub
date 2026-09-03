import axios from "axios";

// Backend base URL. Leave REACT_APP_BACKEND_URL unset to run the site without a backend
// (practice pages work; sign-in, XP and payments need it).
const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
export const BACKEND_CONFIGURED = BACKEND_URL !== "";
export const API = `${BACKEND_URL}/api`;

const client = axios.create({
  baseURL: API,
  withCredentials: true,
  // Only JSON is a valid answer from the API; an HTML page means we hit the wrong host.
  validateStatus: (s) => s >= 200 && s < 300,
});

client.interceptors.request.use((config) => {
  if (!BACKEND_CONFIGURED) return Promise.reject(new Error("Backend not configured (REACT_APP_BACKEND_URL)"));
  const token = localStorage.getItem("datahub_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
client.interceptors.response.use((res) => {
  const ct = String(res.headers?.["content-type"] || "");
  if (ct.includes("text/html")) return Promise.reject(new Error("API returned HTML — check REACT_APP_BACKEND_URL"));
  return res;
});

export default client;

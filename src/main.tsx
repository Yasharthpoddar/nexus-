
  import axios from "axios";
  import { createRoot } from "react-dom/client";
  import { BrowserRouter } from "react-router";
  import { AuthProvider } from "./app/context/AuthContext";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // ── Global axios configuration ─────────────────────────────────────────────
  // In dev, point to local backend. In production, point to Render.
  const isLocal = import.meta.env.DEV;
  const baseURL = isLocal ? 'http://localhost:5006' : 'https://nexus-oa2l.onrender.com';
  console.log('[NEXUS DEBUG] API BaseURL:', baseURL, { isLocal });
  axios.defaults.baseURL = baseURL;


  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('nexus_token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });

  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
  
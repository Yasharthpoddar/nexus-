
  import axios from "axios";
  import { createRoot } from "react-dom/client";
  import { BrowserRouter } from "react-router";
  import { AuthProvider } from "./app/context/AuthContext";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // ── Global axios configuration ─────────────────────────────────────────────
  // In dev, point to local backend. In production, point to Render.
  const isLocal = import.meta.env.DEV;
  axios.defaults.baseURL = isLocal ? 'http://localhost:5006' : 'https://nexus-oa2l.onrender.com';


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
  
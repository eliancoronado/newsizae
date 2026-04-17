// main.jsx o App.jsx
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./login/Login.jsx";
import Dashboard from "./Dashboard.jsx";
import ProfilePage from "./components/ProfilePage.jsx";
import { useFullscreen } from "./hooks/useFullscreen";
import AppB from "./components/AppB.jsx";

// Componente que envuelve toda la app con pantalla completa
const AppWithFullscreen = () => {
  const { enterFullscreen } = useFullscreen();

  // Agregar un listener para activar pantalla completa con el primer clic
  useEffect(() => {
    const handleFirstClick = () => {
      enterFullscreen();
      document.removeEventListener("click", handleFirstClick);
    };

    document.addEventListener("click", handleFirstClick);
    document.addEventListener("touchstart", handleFirstClick);
    return () => {
      document.removeEventListener("click", handleFirstClick);
      document.removeEventListener("touchstart", handleFirstClick);
    };
  }, [enterFullscreen]);
  
/*
  // Registrar Service Worker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ Service Worker registrado:', registration);
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }
};

registerServiceWorker();
*/

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile/:uid" element={<ProfilePage />} />
        <Route path="/profile/:uid" element={<ProfilePage />} />
        <Route path="/project/:id" element={<AppB />} />
      </Routes>
    </Router>
  );
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppWithFullscreen />
  </StrictMode>,
);

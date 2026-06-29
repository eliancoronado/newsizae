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
import AppBB from "./components/AppBB.jsx";
import StorePage from "./components/StorePage.jsx";
import LoginApp from "./login/LoginApp.jsx";
import { LiveblocksProvider } from "@liveblocks/react";
import { client } from "../liveblocks.config";
import AppBP from "./components/AppBP.jsx";
import AppTTT from "./components/AppTTT.jsx";

// Componente que envuelve toda la app con pantalla completa
const AppWithFullscreen = () => {
  

  
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
    <LiveblocksProvider publicApiKey={"pk_prod_3YTIp5Io9lBV9mFi8Vs8vKJjql6sukhzjdMNjJbXkcmIzJFIb8mDxm0juqmPUvHL"}>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/loginapp" element={<LoginApp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/:uid" element={<ProfilePage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/profile/:uid" element={<ProfilePage />} />
          <Route path="/project/:id" element={<AppB />} />
          <Route path="/projects/:id" element={<AppBB />} />
          <Route path="/projecttt/:id" element={<AppBP />} />
          <Route path="/projectt/:id" element={<AppTTT />} />
        </Routes>
      </Router>
    </LiveblocksProvider>
  );
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppWithFullscreen />
  </StrictMode>,
);

import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import PwaInstallPrompt from "./components/shared/PwaInstallPrompt.jsx";
import SplashScreen from "./components/shared/SplashScreen.jsx";
import Admin from "./pages/admin/Admin.jsx";
import Login from "./pages/auth/Login.jsx";
import DoctorPage from "./pages/doctor/DoctorPage.jsx";
import LabTechnicianPage from "./pages/lab-technician/LabTechnicianPage.jsx";
import { LAB_VIEW_ROUTES } from "./pages/lab-technician/lab-config/labNavigationConfig.js";
import NursePage from "./pages/nurse/NursePage.jsx";
import LandingPage from "./pages/public/LandingPage.jsx";
import Queue from "./pages/shared/Queue.jsx";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Admin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/queue"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR", "NURSE"]}>
                <Queue />
              </ProtectedRoute>
            }
          />

          <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
          <Route
            path="/doctor/*"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR"]}>
                <DoctorPage />
              </ProtectedRoute>
            }
          />

          <Route path="/triage" element={<Navigate to="/triage/dashboard" replace />} />
          <Route
            path="/triage/*"
            element={
              <ProtectedRoute allowedRoles={["NURSE"]}>
                <NursePage />
              </ProtectedRoute>
            }
          />

          <Route path="/lab" element={<Navigate to={LAB_VIEW_ROUTES.dashboard} replace />} />
          <Route
            path="/lab/*"
            element={
              <ProtectedRoute allowedRoles={["LAB_TECHNICIAN"]}>
                <LabTechnicianPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <PwaInstallPrompt />
    </>
  );
}

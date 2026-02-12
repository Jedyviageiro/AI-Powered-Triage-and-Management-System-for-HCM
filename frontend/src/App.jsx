import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Queue from "./pages/Queue.jsx";
import Admin from "./pages/Admin.jsx";
import TriageNurse from "./pages/TriageNurse.jsx";
import Doctor from "./pages/Doctor.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* NURSE */}
        <Route
          path="/triage"
          element={
            <ProtectedRoute allowedRoles={["NURSE"]}>
              <TriageNurse />
            </ProtectedRoute>
          }
        />

        {/* Queue (NURSE/DOCTOR) */}
        <Route
          path="/queue"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR", "NURSE"]}>
              <Queue />
            </ProtectedRoute>
          }
        />

        {/* DOCTOR */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <Doctor />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

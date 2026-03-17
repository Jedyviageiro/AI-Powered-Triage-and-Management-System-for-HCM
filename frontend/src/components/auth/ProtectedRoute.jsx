import { Navigate } from "react-router-dom";
import { getToken, getUser } from "../../lib/auth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = getToken();
  const user = getUser();

  if (!token) return <Navigate to="/login" replace />;

  // se tiver regra de roles, aplica
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      // manda para destino correto
      if (user?.role === "ADMIN") return <Navigate to="/admin" replace />;
      if (user?.role === "DOCTOR") return <Navigate to="/doctor/dashboard" replace />;
      if (user?.role === "NURSE") return <Navigate to="/triage/dashboard" replace />;
      if (user?.role === "LAB_TECHNICIAN") return <Navigate to="/lab/dashboard" replace />;
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

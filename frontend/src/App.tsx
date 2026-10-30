import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Scanner from "./pages/Scanner";
import Diary from "./pages/Diary";
import Alternatives from "./pages/Alternatives";
import Goals from "./pages/Goals";
import Profile from "./pages/Profile";
import NutritionCoach from "./pages/NutritionCoach";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider><ToastProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="scanner" element={<Scanner />} />
              <Route path="diary" element={<Diary />} />
              <Route path="alternatives" element={<Alternatives />} />
              <Route path="goals" element={<Goals />} />
              <Route path="profile" element={<Profile />} />
              <Route path="nutrition-coach" element={<NutritionCoach />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider></AuthProvider>
    </BrowserRouter>
  );
}

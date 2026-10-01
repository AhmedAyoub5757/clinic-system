import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AppLayout from "./components/AppLayout";
import PatientsPage from "./pages/PatientsPage";
import PatientFormPage from "./pages/PatientFormPage";
import DoctorsPage from "./pages/DoctorsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import BookAppointmentPage from "./pages/BookAppointmentPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route
              path="/patients/new"
              element={
                <ProtectedRoute roles={["receptionist"]}>
                  <PatientFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:id/edit"
              element={
                <ProtectedRoute roles={["receptionist"]}>
                  <PatientFormPage />
                </ProtectedRoute>
              }
            />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route
              path="/appointments/new"
              element={
                <ProtectedRoute roles={["receptionist"]}>
                  <BookAppointmentPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

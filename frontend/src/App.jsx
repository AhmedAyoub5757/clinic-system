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
import ConsultationFormPage from "./pages/ConsultationFormPage";
import ConsultationPage from "./pages/ConsultationPage";
import PatientHistoryPage from "./pages/PatientHistoryPage";

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
            <Route
              path="/appointments/:appointmentId/consultation/new"
              element={
                <ProtectedRoute roles={["doctor"]}>
                  <ConsultationFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultations/:id"
              element={
                <ProtectedRoute roles={["doctor"]}>
                  <ConsultationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultations/:id/edit"
              element={
                <ProtectedRoute roles={["doctor"]}>
                  <ConsultationFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:id/history"
              element={
                <ProtectedRoute roles={["doctor"]}>
                  <PatientHistoryPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

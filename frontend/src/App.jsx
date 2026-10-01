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
import UsersPage from "./pages/UsersPage";
import UserFormPage from "./pages/UserFormPage";
import DoctorFormPage from "./pages/DoctorFormPage";
import RescheduleAppointmentPage from "./pages/RescheduleAppointmentPage";

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
            <Route
              path="/users"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/new"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <UserFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:id/edit"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <UserFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctors/new"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <DoctorFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctors/:id/edit"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <DoctorFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments/:id/reschedule"
              element={
                <ProtectedRoute roles={["receptionist"]}>
                  <RescheduleAppointmentPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

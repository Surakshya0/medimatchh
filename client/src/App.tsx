import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/lib/auth.tsx";
import { InitializePatientProfile } from "@/components/patient/InitializePatientProfile";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

// Patient pages
import PatientDashboard from "@/pages/patient/Dashboard";
import Appointments from "@/pages/patient/Appointments";
import HealthRecords from "@/pages/patient/HealthRecords";
import PatientSettings from "@/pages/patient/Settings";
import BookAppointment from "@/pages/patient/BookAppointment";
import AISymptomChecker from "@/pages/patient/AISymptomChecker"; // ← new

// Doctor pages
import DoctorDashboard from "@/pages/doctor/Dashboard";
import Schedule from "@/pages/doctor/Schedule";
import Patients from "@/pages/doctor/Patients";
import DoctorProfile from "@/pages/doctor/Profile";
import DoctorSettings from "@/pages/doctor/Settings";

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      {/* Admin routes */}
      <Route path="/admin/dashboard" component={AdminDashboard} />

      {/* Patient routes */}
      <Route path="/patient/dashboard" component={PatientDashboard} />
      <Route path="/patient/appointments" component={Appointments} />
      <Route path="/patient/health-records" component={HealthRecords} />
      <Route path="/patient/settings" component={PatientSettings} />
      <Route path="/patient/book-appointment/:doctorId" component={BookAppointment} />
      <Route path="/patient/ai-checker" component={AISymptomChecker} /> {/* ← new */}

      {/* Doctor routes */}
      <Route path="/doctor/dashboard" component={DoctorDashboard} />
      <Route path="/doctor/schedule" component={Schedule} />
      <Route path="/doctor/patients" component={Patients} />
      <Route path="/doctor/profile" component={DoctorProfile} />
      <Route path="/doctor/patient-records/:patientId" component={Patients} />
      <Route path="/doctor/settings" component={DoctorSettings} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <InitializePatientProfile />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

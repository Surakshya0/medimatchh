import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import PatientDashboard from "@/components/patient/PatientDashboard";

export default function Dashboard() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
    else if (!isLoading && isAuthenticated && user?.userType !== "patient") {
      if (user?.userType === "doctor") setLocation("/doctor/dashboard");
      else if (user?.userType === "admin") setLocation("/admin/dashboard");
    }
  }, [isAuthenticated, isLoading, user, setLocation]);

  if (!isAuthenticated || user?.userType !== "patient") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <PatientDashboard />
    </div>
  );
}

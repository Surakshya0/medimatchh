import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar, Clock, User, Video, MapPin, Upload, X, Activity, Users,
  Stethoscope, Search, Trash2, CheckCircle, Ban, Plus, AlertTriangle, LogOut
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

// ── Types ─────────────────────────────────────────────────────────────────
interface Doctor {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  specialty: string;
  email?: string;
  phone?: string;
  bio?: string;
  city?: string;
  country?: string;
  rating?: number;
  experience?: number;
  profilePicture?: string;
  hospitalAffiliation?: string;
}

interface Patient {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  medicalHistory?: string;
  bloodType?: string;
  address?: string;
  profilePicture?: string;
  gender?: string;
}

interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  date: string;
  duration: number;
  status: string;
  type: string;
  reasonForVisit: string;
  doctor?: Doctor;
  patient?: Patient;
  symptoms?: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
const SPECIALTIES = [
  "General Practice", "Internal Medicine", "Pediatrics", "Cardiology",
  "Orthopedics", "Neurology", "Dermatology", "Ophthalmology",
  "ENT", "Psychiatry", "Obstetrics & Gynecology", "Urology",
  "Gastroenterology", "Pulmonology", "Endocrinology", "Nephrology",
  "Rheumatology", "Oncology", "Emergency Medicine", "Family Medicine",
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const GENDERS = ["male", "female", "other"];

const NEPAL_PROVINCES = [
  "Province 1", "Province 2", "Bagmati", "Gandaki", "Lumbini",
  "Karnali", "Sudurpashchim",
];

function formatDate(dateString: string) {
  return format(new Date(dateString), "PPP");
}
function formatTime(dateString: string) {
  return format(new Date(dateString), "p");
}
function formatDateInput(dateString?: string) {
  if (!dateString) return "";
  try { return new Date(dateString).toISOString().split("T")[0]; } catch { return ""; }
}

// ── Component ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const isAdmin = user?.userType === "admin";
  const [, setLocation] = useLocation();
  const [activeApptTab, setActiveApptTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search
  const [doctorSearch, setDoctorSearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");

  // Dialogs
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [editDoctorOpen, setEditDoctorOpen] = useState(false);
  const [viewDoctorOpen, setViewDoctorOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [editPatientOpen, setEditPatientOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: "doctor" | "patient"; id: number; name: string } | null>(null);

  // Image upload
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.readAsDataURL(file);
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        setUploadedImage(await convertToBase64(e.target.files[0]));
      } catch {
        toast({ title: "Upload Error", description: "Failed to upload image.", variant: "destructive" });
      }
    }
  };

  // ── Auth guard ──
  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
    else if (!isLoading && isAuthenticated && !isAdmin) {
      if (user?.userType === "doctor") setLocation("/doctor/dashboard");
      else if (user?.userType === "patient") setLocation("/patient/dashboard");
    }
  }, [isAuthenticated, isLoading, user, setLocation]);

  // ── Queries ──
  const { data: doctors = [], isLoading: loadingDocs } = useQuery<Doctor[]>({
    queryKey: ["/api/admin/doctors"], enabled: isAuthenticated && isAdmin,
  });
  const { data: patients = [], isLoading: loadingPats } = useQuery<Patient[]>({
    queryKey: ["/api/admin/patients"], enabled: isAuthenticated && isAdmin,
  });
  const { data: appointments = [], isLoading: loadingAppts } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"], enabled: isAuthenticated,
  });

  const filteredAppointments = () => {
    if (activeApptTab === "all") return appointments;
    return appointments.filter((a) => a.status.toLowerCase() === activeApptTab.toLowerCase());
  };

  const filteredDoctors = doctors.filter((d) =>
    !doctorSearch || `${d.firstName} ${d.lastName} ${d.specialty} ${d.email || ""}`
      .toLowerCase().includes(doctorSearch.toLowerCase())
  );
  const filteredPatients = patients.filter((p) =>
    !patientSearch || `${p.firstName} ${p.lastName} ${p.email || ""} ${p.phone || ""}`
      .toLowerCase().includes(patientSearch.toLowerCase())
  );

  // ── Mutations ──
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/doctors"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/patients"] });
    queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
  };

  // Update doctor
  const updateDoctor = useMutation({
    mutationFn: async (data: Partial<Doctor>) => {
      const res = await apiRequest("PATCH", `/api/admin/doctors/${selectedDoctor?.id}`, data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); setEditDoctorOpen(false); setSelectedDoctor(null); setUploadedImage(null);
      toast({ title: "Doctor Updated", description: "Doctor profile updated successfully." }); },
    onError: (e) => toast({ title: "Update Failed", description: e.message || "Failed to update.", variant: "destructive" }),
  });

  // Update patient
  const updatePatient = useMutation({
    mutationFn: async (data: Partial<Patient>) => {
      const res = await apiRequest("PATCH", `/api/admin/patients/${selectedPatient?.id}`, data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); setEditPatientOpen(false); setSelectedPatient(null); setUploadedImage(null);
      toast({ title: "Patient Updated", description: "Patient profile updated successfully." }); },
    onError: (e) => toast({ title: "Update Failed", description: e.message || "Failed to update.", variant: "destructive" }),
  });

  // Create doctor
  const createDoctor = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; email: string; password: string; specialty: string; experience: number; hospitalAffiliation: string }) => {
      const res = await apiRequest("POST", "/api/admin/doctors", data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); setAddDoctorOpen(false);
      toast({ title: "Doctor Created", description: "New doctor account created." }); },
    onError: (e) => toast({ title: "Creation Failed", description: e.message || "Failed to create doctor.", variant: "destructive" }),
  });

  // Create patient
  const createPatient = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; email: string; password: string; phone?: string }) => {
      const res = await apiRequest("POST", "/api/admin/patients", data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); setAddPatientOpen(false);
      toast({ title: "Patient Created", description: "New patient account created." }); },
    onError: (e) => toast({ title: "Creation Failed", description: e.message || "Failed to create patient.", variant: "destructive" }),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      await apiRequest("DELETE", `/api/admin/${type}s/${id}`);
    },
    onSuccess: () => { invalidateAll(); setDeleteTarget(null);
      toast({ title: "Deleted", description: "Removed successfully." }); },
    onError: (e) => toast({ title: "Delete Failed", description: e.message || "Failed to delete.", variant: "destructive" }),
  });

  // Appointment action
  const updateApptStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/appointments/${id}`, { status });
    },
    onSuccess: (_, vars) => {
      invalidateAll();
      toast({ title: "Appointment Updated", description: `Marked as ${vars.status}.` });
    },
    onError: (e) => toast({ title: "Update Failed", description: e.message || "Failed to update.", variant: "destructive" }),
  });

  // ── Status badge ──
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return <Badge className="bg-emerald-100 text-emerald-600 border-emerald-200">Confirmed</Badge>;
      case "pending": return <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>;
      case "completed": return <Badge className="bg-sky-100 text-sky-600 border-sky-200">Completed</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // ── Loading skeleton ──
  if (isLoading || loadingAppts || loadingDocs || loadingPats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24 animate-pulse space-y-6">
          <div className="h-32 bg-sky-100 rounded-3xl" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-sky-100 rounded-2xl" />)}
          </div>
          <div className="h-96 bg-sky-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24 space-y-6">

        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-white rounded-3xl">
          <div className="absolute -top-8 -right-8 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative px-6 py-10 flex items-start justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">Admin Panel</p>
              <h1 className="text-3xl md:text-4xl font-bold">Welcome, {user?.firstName}!</h1>
              <p className="text-white/75 mt-1 text-sm">
                Managing {doctors.length} doctors, {patients.length} patients, and {appointments.length} appointments
              </p>
            </div>
            <button onClick={logout} className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-sky-400 to-blue-500 text-white rounded-3xl p-5 shadow-sm">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
              <Stethoscope className="h-5 w-5" />
            </div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Doctors</p>
            <p className="text-3xl font-bold mt-0.5">{doctors.length}</p>
            <p className="text-white/70 text-xs mt-1">registered</p>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-sm">
            <div className="w-10 h-10 bg-sky-50 rounded-2xl flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-sky-400" />
            </div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Patients</p>
            <p className="text-3xl font-bold text-[#2E3A59] mt-0.5">{patients.length}</p>
            <p className="text-gray-400 text-xs mt-1">registered</p>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-sm">
            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center mb-3">
              <Activity className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Appointments</p>
            <p className="text-3xl font-bold text-[#2E3A59] mt-0.5">{appointments.length}</p>
            <p className="text-gray-400 text-xs mt-1">total</p>
          </div>
        </div>

        {/* ── Main content tabs ── */}
        <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-sky-50">
            <h2 className="font-bold text-[#2E3A59] text-lg">Admin Panel</h2>
          </div>
          <div className="p-6">
            <Tabs defaultValue="appointments">
              <TabsList className="grid w-full grid-cols-3 bg-sky-50/50 rounded-2xl p-1">
                <TabsTrigger value="appointments" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">
                  Appointments
                </TabsTrigger>
                <TabsTrigger value="doctors" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">
                  Doctors
                </TabsTrigger>
                <TabsTrigger value="patients" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">
                  Patients
                </TabsTrigger>
              </TabsList>

              {/* ═══ Appointments Tab ═══ */}
              <TabsContent value="appointments" className="mt-6">
                <Tabs defaultValue="all" onValueChange={setActiveApptTab}>
                  <TabsList className="grid w-full grid-cols-4 bg-sky-50/50 rounded-2xl p-1">
                    <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">All</TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Pending</TabsTrigger>
                    <TabsTrigger value="confirmed" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Confirmed</TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Completed</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeApptTab} className="mt-6">
                    <div className="divide-y divide-sky-50">
                      {filteredAppointments().length > 0 ? filteredAppointments().map((appt) => (
                        <div key={appt.id} className="flex items-center gap-4 px-2 py-4 hover:bg-sky-50/40 transition-colors rounded-2xl">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-200 to-blue-200 flex items-center justify-center text-sky-700 font-bold text-sm flex-shrink-0">
                            {appt.patient?.firstName?.[0]}{appt.patient?.lastName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#2E3A59] text-sm">
                              Dr. {appt.doctor?.firstName || ""} {appt.doctor?.lastName || ""}
                              <span className="text-gray-400 mx-1.5">&rarr;</span>
                              {appt.patient?.firstName || ""} {appt.patient?.lastName || ""}
                            </p>
                            <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-3">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(appt.date)}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(appt.date)}</span>
                              <span className="flex items-center gap-1">
                                {appt.type === 'video' ? <><Video className="h-3 w-3" />Video</> : <><MapPin className="h-3 w-3" />In-person</>}
                              </span>
                            </p>
                            {appt.reasonForVisit && (
                              <p className="text-gray-400 text-xs mt-0.5 italic">{appt.reasonForVisit}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getStatusBadge(appt.status)}
                            <div className="flex gap-1">
                              {appt.status === "pending" && (
                                <button
                                  onClick={() => updateApptStatus.mutate({ id: appt.id, status: "confirmed" })}
                                  className="text-xs text-emerald-500 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
                                  title="Confirm">
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              {(appt.status === "pending" || appt.status === "confirmed") && (
                                <button
                                  onClick={() => updateApptStatus.mutate({ id: appt.id, status: "cancelled" })}
                                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Cancel">
                                  <Ban className="h-4 w-4" />
                                </button>
                              )}
                              {appt.status === "confirmed" && (
                                <button
                                  onClick={() => updateApptStatus.mutate({ id: appt.id, status: "completed" })}
                                  className="text-xs text-sky-500 hover:text-sky-700 px-2 py-1 rounded-lg hover:bg-sky-50 transition-colors"
                                  title="Mark completed">
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          No {activeApptTab !== 'all' ? activeApptTab : ''} appointments found.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* ═══ Doctors Tab ═══ */}
              <TabsContent value="doctors" className="mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h3 className="font-bold text-[#2E3A59]">Manage Doctors</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                      <Input
                        placeholder="Search doctors..."
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                        className="pl-9 h-9 rounded-xl border-sky-100 text-sm w-full sm:w-64"
                      />
                    </div>
                    <Button onClick={() => setAddDoctorOpen(true)}
                      className="bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm rounded-xl hover:from-sky-500 hover:to-blue-600">
                      <Plus className="h-4 w-4 mr-1" />Add Doctor
                    </Button>
                  </div>
                </div>
                <div className="divide-y divide-sky-50">
                  {filteredDoctors.length > 0 ? filteredDoctors.map((doctor) => (
                    <div key={doctor.id} className="flex items-center gap-4 px-2 py-4 hover:bg-sky-50/40 transition-colors rounded-2xl">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-200 to-blue-200 flex items-center justify-center text-sky-700 font-bold flex-shrink-0">
                        {doctor.firstName[0]}{doctor.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#2E3A59] text-sm">Dr. {doctor.firstName} {doctor.lastName}</p>
                        <p className="text-gray-400 text-xs mt-0.5 flex flex-wrap gap-x-3">
                          <span className="text-sky-500 font-medium">{doctor.specialty}</span>
                          {doctor.email && <span>&middot; {doctor.email}</span>}
                          {doctor.experience && <span>&middot; {doctor.experience}yrs exp</span>}
                          {doctor.city && <span>&middot; {doctor.city}</span>}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedDoctor(doctor); setViewDoctorOpen(true); }}
                          className="rounded-xl border-sky-100 text-sky-600 hover:bg-sky-50 text-xs">View</Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedDoctor(doctor); setUploadedImage(doctor.profilePicture || null); setEditDoctorOpen(true); }}
                          className="rounded-xl border-sky-100 text-sky-600 hover:bg-sky-50 text-xs">Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteTarget({ type: "doctor", id: doctor.id, name: `Dr. ${doctor.firstName} ${doctor.lastName}` })}
                          className="rounded-xl border-red-100 text-red-400 hover:bg-red-50 text-xs"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      {doctorSearch ? "No doctors match your search." : "No doctors found."}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ═══ Patients Tab ═══ */}
              <TabsContent value="patients" className="mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h3 className="font-bold text-[#2E3A59]">Manage Patients</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                      <Input
                        placeholder="Search patients..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="pl-9 h-9 rounded-xl border-sky-100 text-sm w-full sm:w-64"
                      />
                    </div>
                    <Button onClick={() => setAddPatientOpen(true)}
                      className="bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm rounded-xl hover:from-sky-500 hover:to-blue-600">
                      <Plus className="h-4 w-4 mr-1" />Add Patient
                    </Button>
                  </div>
                </div>
                <div className="divide-y divide-sky-50">
                  {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center gap-4 px-2 py-4 hover:bg-sky-50/40 transition-colors rounded-2xl">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-200 to-blue-200 flex items-center justify-center text-sky-700 font-bold flex-shrink-0">
                        {patient.firstName[0]}{patient.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#2E3A59] text-sm">{patient.firstName} {patient.lastName}</p>
                        <p className="text-gray-400 text-xs mt-0.5 flex flex-wrap gap-x-3">
                          {patient.email && <span>{patient.email}</span>}
                          {patient.phone && <span>&middot; {patient.phone}</span>}
                          {patient.dateOfBirth && <span>&middot; DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</span>}
                          {patient.bloodType && <span>&middot; {patient.bloodType}</span>}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedPatient(patient); setUploadedImage(patient.profilePicture || null); setEditPatientOpen(true); }}
                          className="rounded-xl border-sky-100 text-sky-600 hover:bg-sky-50 text-xs">Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteTarget({ type: "patient", id: patient.id, name: `${patient.firstName} ${patient.lastName}` })}
                          className="rounded-xl border-red-100 text-red-400 hover:bg-red-50 text-xs"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      {patientSearch ? "No patients match your search." : "No patients found."}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  DIALOGS                                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {/* ── View Doctor ── */}
      <Dialog open={viewDoctorOpen} onOpenChange={setViewDoctorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Doctor Profile</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4">
              {selectedDoctor?.profilePicture ? (
                <img src={selectedDoctor.profilePicture} alt="" className="w-32 h-32 rounded-full object-cover" />
              ) : (
                <div className="w-32 h-32 bg-sky-100 rounded-full flex items-center justify-center">
                  <User className="h-16 w-16 text-sky-400" />
                </div>
              )}
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-medium">Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</h3>
                <p className="text-sm text-gray-500">{selectedDoctor?.specialty}</p>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              {selectedDoctor?.email && <div className="flex items-start"><div className="font-medium w-24 shrink-0">Email:</div><div className="text-sm">{selectedDoctor.email}</div></div>}
              {selectedDoctor?.phone && <div className="flex items-start"><div className="font-medium w-24 shrink-0">Phone:</div><div className="text-sm">{selectedDoctor.phone}</div></div>}
              {selectedDoctor?.experience != null && <div className="flex items-start"><div className="font-medium w-24 shrink-0">Experience:</div><div className="text-sm">{selectedDoctor.experience} years</div></div>}
              {selectedDoctor?.hospitalAffiliation && <div className="flex items-start"><div className="font-medium w-24 shrink-0">Hospital:</div><div className="text-sm">{selectedDoctor.hospitalAffiliation}</div></div>}
              {selectedDoctor?.city && <div className="flex items-start"><div className="font-medium w-24 shrink-0">Location:</div><div className="text-sm">{selectedDoctor.city}{selectedDoctor.country ? `, ${selectedDoctor.country}` : ''}</div></div>}
              {selectedDoctor?.rating != null && <div className="flex items-start"><div className="font-medium w-24 shrink-0">Rating:</div><div className="text-sm">{selectedDoctor.rating}/5</div></div>}
            </div>
          </div>
          <DialogFooter><DialogClose asChild><Button type="button">Close</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Doctor ── */}
      <Dialog open={editDoctorOpen} onOpenChange={setEditDoctorOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Doctor Profile</DialogTitle></DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="flex flex-col items-center gap-3">
              {uploadedImage ? (
                <div className="relative w-28 h-28">
                  <img src={uploadedImage} alt="" className="w-28 h-28 rounded-full object-cover" />
                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => setUploadedImage(null)}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="w-28 h-28 bg-sky-100 rounded-full flex items-center justify-center">
                  <User className="h-12 w-12 text-sky-400" />
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}
                className="flex gap-2 items-center rounded-xl"><Upload className="h-4 w-4" />Photo</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">First Name</Label>
                <Input defaultValue={selectedDoctor?.firstName || ""}
                  onChange={(e) => setSelectedDoctor((p) => p ? { ...p, firstName: e.target.value } : p)}
                  className="rounded-xl border-sky-100 h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Last Name</Label>
                <Input defaultValue={selectedDoctor?.lastName || ""}
                  onChange={(e) => setSelectedDoctor((p) => p ? { ...p, lastName: e.target.value } : p)}
                  className="rounded-xl border-sky-100 h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Specialty</Label>
              <Select defaultValue={selectedDoctor?.specialty || ""}
                onValueChange={(v) => setSelectedDoctor((p) => p ? { ...p, specialty: v } : p)}>
                <SelectTrigger className="rounded-xl border-sky-100 h-10">
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Experience (years)</Label>
                <Input type="number" defaultValue={selectedDoctor?.experience || ""}
                  onChange={(e) => setSelectedDoctor((p) => p ? { ...p, experience: Number(e.target.value) } : p)}
                  className="rounded-xl border-sky-100 h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Hospital Affiliation</Label>
                <Input defaultValue={selectedDoctor?.hospitalAffiliation || ""}
                  onChange={(e) => setSelectedDoctor((p) => p ? { ...p, hospitalAffiliation: e.target.value } : p)}
                  className="rounded-xl border-sky-100 h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">City</Label>
              <Input defaultValue={selectedDoctor?.city || ""}
                onChange={(e) => setSelectedDoctor((p) => p ? { ...p, city: e.target.value } : p)}
                className="rounded-xl border-sky-100 h-10" />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="button" onClick={() => {
              if (!selectedDoctor) return;
              updateDoctor.mutate({
                firstName: selectedDoctor.firstName,
                lastName: selectedDoctor.lastName,
                specialty: selectedDoctor.specialty,
                experience: selectedDoctor.experience,
                hospitalAffiliation: selectedDoctor.hospitalAffiliation,
                city: selectedDoctor.city,
                profilePicture: uploadedImage ?? undefined,
              });
            }} disabled={updateDoctor.isPending}>
              {updateDoctor.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Doctor ── */}
      <Dialog open={addDoctorOpen} onOpenChange={setAddDoctorOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add New Doctor</DialogTitle></DialogHeader>
          <AddDoctorForm onSubmit={(data) => createDoctor.mutate(data)} isPending={createDoctor.isPending} />
        </DialogContent>
      </Dialog>

      {/* ── Edit Patient ── */}
      <Dialog open={editPatientOpen} onOpenChange={setEditPatientOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Patient Profile</DialogTitle></DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="flex flex-col items-center gap-3">
              {uploadedImage ? (
                <div className="relative w-28 h-28">
                  <img src={uploadedImage} alt="" className="w-28 h-28 rounded-full object-cover" />
                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => setUploadedImage(null)}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="w-28 h-28 bg-sky-100 rounded-full flex items-center justify-center">
                  <User className="h-12 w-12 text-sky-400" />
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}
                className="flex gap-2 items-center rounded-xl"><Upload className="h-4 w-4" />Photo</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">First Name</Label>
                <Input defaultValue={selectedPatient?.firstName || ""}
                  onChange={(e) => setSelectedPatient((p) => p ? { ...p, firstName: e.target.value } : p)}
                  className="rounded-xl border-sky-100 h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Last Name</Label>
                <Input defaultValue={selectedPatient?.lastName || ""}
                  onChange={(e) => setSelectedPatient((p) => p ? { ...p, lastName: e.target.value } : p)}
                  className="rounded-xl border-sky-100 h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Phone</Label>
                <Input defaultValue={selectedPatient?.phone || ""}
                  onChange={(e) => setSelectedPatient((p) => p ? { ...p, phone: e.target.value } : p)}
                  className="rounded-xl border-sky-100 h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Date of Birth</Label>
                <Input type="date" defaultValue={formatDateInput(selectedPatient?.dateOfBirth)}
                  onChange={(e) => setSelectedPatient((p) => p ? { ...p, dateOfBirth: e.target.value } : p)}
                  className="rounded-xl border-sky-100 h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Gender</Label>
                <Select defaultValue={selectedPatient?.gender || ""}
                  onValueChange={(v) => setSelectedPatient((p) => p ? { ...p, gender: v } : p)}>
                  <SelectTrigger className="rounded-xl border-sky-100 h-10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Blood Type</Label>
                <Select defaultValue={selectedPatient?.bloodType || ""}
                  onValueChange={(v) => setSelectedPatient((p) => p ? { ...p, bloodType: v } : p)}>
                  <SelectTrigger className="rounded-xl border-sky-100 h-10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPES.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Address</Label>
              <Input defaultValue={selectedPatient?.address || ""}
                onChange={(e) => setSelectedPatient((p) => p ? { ...p, address: e.target.value } : p)}
                className="rounded-xl border-sky-100 h-10" />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="button" onClick={() => {
              if (!selectedPatient) return;
              updatePatient.mutate({
                firstName: selectedPatient.firstName,
                lastName: selectedPatient.lastName,
                phone: selectedPatient.phone,
                dateOfBirth: selectedPatient.dateOfBirth,
                gender: selectedPatient.gender,
                bloodType: selectedPatient.bloodType,
                address: selectedPatient.address,
                profilePicture: uploadedImage ?? undefined,
              });
            }} disabled={updatePatient.isPending}>
              {updatePatient.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Patient ── */}
      <Dialog open={addPatientOpen} onOpenChange={setAddPatientOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add New Patient</DialogTitle></DialogHeader>
          <AddPatientForm onSubmit={(data) => createPatient.mutate(data)} isPending={createPatient.isPending} />
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Delete
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate({ type: deleteTarget.type, id: deleteTarget.id })}
              className="bg-red-500 hover:bg-red-600 text-white">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Add Doctor Form ────────────────────────────────────────────────────────
function AddDoctorForm({ onSubmit, isPending }: { onSubmit: (d: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "doctor123", specialty: "", experience: 5, hospitalAffiliation: "" });
  const [err, setErr] = useState("");
  const valid = form.firstName && form.lastName && form.email && form.specialty;
  return (
    <form onSubmit={(e) => { e.preventDefault(); setErr(""); if (!valid) return; onSubmit(form); }}
      className="grid gap-5 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">First Name *</Label>
          <Input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            className="rounded-xl border-sky-100 h-10" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Last Name *</Label>
          <Input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            className="rounded-xl border-sky-100 h-10" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-500">Email *</Label>
        <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className="rounded-xl border-sky-100 h-10" required />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-500">Specialty *</Label>
        <Select value={form.specialty} onValueChange={(v) => setForm((p) => ({ ...p, specialty: v }))}>
          <SelectTrigger className="rounded-xl border-sky-100 h-10">
            <SelectValue placeholder="Select specialty" />
          </SelectTrigger>
          <SelectContent>
            {SPECIALTIES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Experience (years)</Label>
          <Input type="number" value={form.experience} onChange={(e) => setForm((p) => ({ ...p, experience: Number(e.target.value) }))}
            className="rounded-xl border-sky-100 h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Hospital Affiliation</Label>
          <Input value={form.hospitalAffiliation} onChange={(e) => setForm((p) => ({ ...p, hospitalAffiliation: e.target.value }))}
            className="rounded-xl border-sky-100 h-10" />
        </div>
      </div>
      <p className="text-xs text-gray-400">Default password: <code className="bg-sky-50 px-1.5 py-0.5 rounded text-sky-600">doctor123</code></p>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <DialogFooter className="sm:justify-between pt-2">
        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
        <Button type="submit" disabled={!valid || isPending}
          className="bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl hover:from-sky-500 hover:to-blue-600">
          {isPending ? "Creating..." : "Create Doctor"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Add Patient Form ───────────────────────────────────────────────────────
function AddPatientForm({ onSubmit, isPending }: { onSubmit: (d: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "patient123", phone: "" });
  const valid = form.firstName && form.lastName && form.email;
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!valid) return; onSubmit(form); }}
      className="grid gap-5 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">First Name *</Label>
          <Input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            className="rounded-xl border-sky-100 h-10" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Last Name *</Label>
          <Input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            className="rounded-xl border-sky-100 h-10" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-500">Email *</Label>
        <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className="rounded-xl border-sky-100 h-10" required />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-500">Phone</Label>
        <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          className="rounded-xl border-sky-100 h-10" />
      </div>
      <p className="text-xs text-gray-400">Default password: <code className="bg-sky-50 px-1.5 py-0.5 rounded text-sky-600">patient123</code></p>
      <DialogFooter className="sm:justify-between pt-2">
        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
        <Button type="submit" disabled={!valid || isPending}
          className="bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl hover:from-sky-500 hover:to-blue-600">
          {isPending ? "Creating..." : "Create Patient"}
        </Button>
      </DialogFooter>
    </form>
  );
}

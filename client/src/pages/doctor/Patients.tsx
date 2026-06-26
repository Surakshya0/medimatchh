import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Calendar, Clock, User, Search, Mail, Phone, MapPin, Droplets, Shield, ChevronLeft, FileText, AlertCircle, Pill, FlaskConical, Activity } from "lucide-react";

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lastVisit?: string;
}

interface PatientFull {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  bloodType?: string;
  profilePicture?: string;
}

interface HealthRecord {
  id: number;
  recordType: string;
  name: string;
  details: string | null;
  date: string;
}

function PatientDetails({ patientId }: { patientId: number }) {
  const { data: patient, isLoading: patientLoading } = useQuery<PatientFull>({
    queryKey: [`/api/patients/${patientId}`],
  });

  const { data: records = [], isLoading: recordsLoading } = useQuery<HealthRecord[]>({
    queryKey: [`/api/health-records/${patientId}`],
  });

  const recordTypeIcons: Record<string, { icon: any; color: string }> = {
    allergy: { icon: AlertCircle, color: "text-orange-500" },
    condition: { icon: Activity, color: "text-red-500" },
    medication: { icon: Pill, color: "text-blue-500" },
    "lab result": { icon: FlaskConical, color: "text-purple-500" },
  };

  if (patientLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">
        <div className="max-w-5xl mx-auto px-6 py-8 pt-24 animate-pulse space-y-6">
          <div className="h-32 bg-sky-200 rounded-3xl" />
          <div className="h-64 bg-sky-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto px-6 py-8 pt-24 space-y-6">
        <Link href="/doctor/patients" className="inline-flex items-center gap-1 text-sky-500 hover:text-sky-600 text-sm font-medium transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to patient list
        </Link>

        <div className="relative overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-white rounded-3xl">
          <div className="absolute -top-8 -right-8 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative px-6 py-8 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
              {patient?.firstName?.[0]}{patient?.lastName?.[0]}
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">Patient Profile</p>
              <h1 className="text-3xl md:text-4xl font-bold">{patient?.firstName} {patient?.lastName}</h1>
              <p className="text-white/75 mt-1 text-sm">Patient ID: #{patient?.id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-sky-50 flex items-center gap-3">
                <User className="h-4 w-4 text-sky-500" />
                <h2 className="font-bold text-[#2E3A59] text-lg">Personal Information</h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Full Name</p>
                  <p className="font-semibold text-[#2E3A59]">{patient?.firstName} {patient?.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1"><Mail className="h-3 w-3 inline mr-1" />Email</p>
                  <p className="font-semibold text-[#2E3A59]">{patient?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1"><Phone className="h-3 w-3 inline mr-1" />Phone</p>
                  <p className="font-semibold text-[#2E3A59]">{patient?.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1"><Calendar className="h-3 w-3 inline mr-1" />Date of Birth</p>
                  <p className="font-semibold text-[#2E3A59]">{patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Gender</p>
                  <p className="font-semibold text-[#2E3A59] capitalize">{patient?.gender || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1"><Droplets className="h-3 w-3 inline mr-1" />Blood Type</p>
                  <p className="font-semibold text-[#2E3A59]">{patient?.bloodType || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-sky-50 flex items-center gap-3">
                <MapPin className="h-4 w-4 text-sky-500" />
                <h2 className="font-bold text-[#2E3A59] text-lg">Address & Insurance</h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1"><MapPin className="h-3 w-3 inline mr-1" />Address</p>
                  <p className="font-semibold text-[#2E3A59]">
                    {[patient?.address, patient?.city, patient?.state, patient?.zipCode].filter(Boolean).join(", ") || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1"><Shield className="h-3 w-3 inline mr-1" />Insurance Provider</p>
                  <p className="font-semibold text-[#2E3A59]">{patient?.insuranceProvider || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Policy Number</p>
                  <p className="font-semibold text-[#2E3A59]">{patient?.insurancePolicyNumber || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-sky-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-sky-500" />
                  <h2 className="font-bold text-[#2E3A59] text-lg">Health Records</h2>
                </div>
              </div>
              <div className="p-6">
                {recordsLoading ? (
                  <p className="text-center py-8 text-gray-400 text-sm">Loading records...</p>
                ) : records.length > 0 ? (
                  <div className="space-y-3">
                    {records.map(record => {
                      const info = recordTypeIcons[record.recordType?.toLowerCase()] ?? { icon: FileText, color: "text-gray-500" };
                      const Icon = info.icon;
                      return (
                        <div key={record.id} className="flex items-start gap-4 p-4 bg-sky-50/40 rounded-2xl border border-sky-100">
                          <Icon className={`h-5 w-5 mt-0.5 ${info.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-sky-500 uppercase tracking-wider px-2 py-0.5 bg-sky-100 rounded-full">
                                {record.recordType}
                              </span>
                              <span className="text-xs text-gray-400">{new Date(record.date).toLocaleDateString()}</span>
                            </div>
                            <p className="font-semibold text-[#2E3A59]">{record.name}</p>
                            {record.details && <p className="text-sm text-gray-400 mt-1">{record.details}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No health records for this patient.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-sky-50">
                <h2 className="font-bold text-[#2E3A59]">Quick Info</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Patient ID</span>
                  <span className="text-sm font-semibold text-[#2E3A59]">#{patient?.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Age</span>
                  <span className="text-sm font-semibold text-[#2E3A59]">
                    {patient?.dateOfBirth
                      ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000)
                      : "N/A"
                    } years
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Records</span>
                  <span className="text-sm font-semibold text-[#2E3A59]">{records.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientList() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["/api/doctor/patients"],
    enabled: !!user && user.userType === "doctor",
  });

  const filteredPatients = (patients as Patient[]).filter((patient) =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto px-6 py-8 pt-24 space-y-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-white rounded-3xl">
          <div className="absolute -top-8 -right-8 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative px-6 py-10">
            <p className="text-white/70 text-sm font-medium mb-1">Doctor Panel</p>
            <h1 className="text-3xl md:text-4xl font-bold">My Patients</h1>
            <p className="text-white/75 mt-1 text-sm">View and manage your patients</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search patients by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-2xl border-sky-100 bg-white shadow-sm"
          />
        </div>

        <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-sky-50">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-sky-500" />
              <h2 className="font-bold text-[#2E3A59] text-lg">
                Patient List ({filteredPatients.length})
              </h2>
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading patients...</div>
            ) : filteredPatients.length > 0 ? (
              <div className="divide-y divide-sky-50">
                {filteredPatients.map((patient: Patient) => (
                  <div key={patient.id} className="flex items-center gap-4 px-2 py-4 hover:bg-sky-50/40 transition-colors rounded-2xl">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-200 to-blue-200 flex items-center justify-center text-sky-700 font-bold flex-shrink-0">
                      {patient.firstName[0]}{patient.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#2E3A59] text-sm">{patient.firstName} {patient.lastName}</p>
                      <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{patient.email}</span>
                        {patient.phone && <><span className="text-gray-300">·</span><span className="flex items-center gap-1"><Phone className="h-3 w-3" />{patient.phone}</span></>}
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Last: {patient.lastVisit || "N/A"}</span>
                      </p>
                    </div>
                    <Link href={`/doctor/patient-records/${patient.id}`}>
                      <Button variant="outline" size="sm" className="rounded-xl border-sky-100 text-sky-600 hover:bg-sky-50">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                {searchTerm ? "No patients found matching your search." : "No patients yet."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DoctorPatients() {
  const [, params] = useRoute<{ patientId: string }>("/doctor/patient-records/:patientId");

  if (params?.patientId) {
    return <PatientDetails patientId={parseInt(params.patientId)} />;
  }

  return <PatientList />;
}

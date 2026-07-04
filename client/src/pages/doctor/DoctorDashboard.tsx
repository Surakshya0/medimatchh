import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Calendar, Clock, Users, UserCheck, Activity, ChevronRight, Settings, LogOut, Stethoscope, FileText, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  date: string;
  duration: number;
  status: string;
  type: string;
  reasonForVisit: string;
  patient: {
    id: number;
    userId: number;
    firstName: string;
    lastName: string;
  };
}

export default function DoctorDashboard() {
  const { user, profile, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const confirmAppt = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/appointments/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/doctor"] });
      toast({ title: "Confirmed", description: "Appointment confirmed successfully." });
    },
    onError: (e) => toast({ title: "Failed", description: e.message || "Could not confirm.", variant: "destructive" }),
  });

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/doctor"],
    enabled: !!user && user.userType === "doctor",
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysAppointments = appointments
    .filter(a => {
      const d = new Date(a.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingAppointments = appointments
    .filter(a => new Date(a.date) > new Date() && a.status !== "cancelled")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pendingCount = appointments.filter(a => a.status === "pending").length;

  const nextAppointment = upcomingAppointments[0];

  const uniquePatientIds = new Set(appointments.map(a => a.patientId));
  const totalPatients = uniquePatientIds.size;

  const seenIds = new Set<number>();
  const recentPatients = appointments
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(a => {
      if (seenIds.has(a.patientId)) return false;
      seenIds.add(a.patientId);
      return true;
    })
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-5xl mx-auto animate-pulse space-y-6">
          <div className="h-32 bg-sky-200 rounded-3xl"/>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-sky-200 rounded-2xl"/>)}
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 h-64 bg-sky-200 rounded-3xl"/>
            <div className="h-64 bg-sky-200 rounded-3xl"/>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">

      <div className="relative overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-white">
        <div className="absolute -top-8 -right-8 w-56 h-56 bg-white/10 rounded-full blur-3xl"/>
        <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-white/10 rounded-full blur-2xl"/>
        <div className="relative max-w-5xl mx-auto px-6 py-10 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {profile?.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt="Profile"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            )}
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold">
                Welcome, Dr. {user?.lastName}!
              </h1>
              <p className="text-white/75 mt-1 text-sm">
                {todaysAppointments.length === 0
                  ? "No appointments scheduled for today"
                  : `You have ${todaysAppointments.length} appointment${todaysAppointments.length !== 1 ? "s" : ""} today`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/doctor/settings">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium">
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

          <div className="bg-gradient-to-br from-sky-400 to-blue-500 text-white rounded-3xl p-5 shadow-sm">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
              <Calendar className="h-5 w-5" />
            </div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Today</p>
            <p className="text-3xl font-bold mt-0.5">{todaysAppointments.length}</p>
            <p className="text-white/70 text-xs mt-1">appointments</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-sm">
            <div className="w-10 h-10 bg-sky-50 rounded-2xl flex items-center justify-center mb-3">
              <Clock className="h-5 w-5 text-sky-500" />
            </div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Upcoming</p>
            <p className="text-3xl font-bold text-[#2E3A59] mt-0.5">{upcomingAppointments.length}</p>
            <p className="text-gray-400 text-xs mt-1">scheduled</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-sm">
            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center mb-3">
              <Activity className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Pending</p>
            <p className="text-3xl font-bold text-[#2E3A59] mt-0.5">{pendingCount}</p>
            <p className="text-gray-400 text-xs mt-1">awaiting confirm</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-sm">
            <div className="w-10 h-10 bg-sky-50 rounded-2xl flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-sky-500" />
            </div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Patients</p>
            <p className="text-3xl font-bold text-[#2E3A59] mt-0.5">{totalPatients}</p>
            <p className="text-gray-400 text-xs mt-1">total seen</p>
          </div>
        </div>

        {nextAppointment && (
          <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center gap-4 p-5">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl
                flex items-center justify-center text-2xl flex-shrink-0">
                <Clock className="h-6 w-6 text-sky-500" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-0.5">Next appointment</p>
                <p className="font-bold text-[#2E3A59]">
                  {nextAppointment.patient.firstName} {nextAppointment.patient.lastName}
                </p>
                <p className="text-gray-400 text-sm">
                  {new Date(nextAppointment.date).toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric"
                  })} at {new Date(nextAppointment.date).toLocaleTimeString("en-US", {
                    hour: "numeric", minute: "2-digit", hour12: true
                  })} · {nextAppointment.type} · {nextAppointment.reasonForVisit}
                </p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 border
                ${nextAppointment.status === "confirmed"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-amber-50 text-amber-600 border-amber-200"
                }`}>
                {nextAppointment.status}
              </span>
              {nextAppointment.status === "pending" && (
                <button
                  onClick={() => confirmAppt.mutate({ id: nextAppointment.id, status: "confirmed" })}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1.5
                    rounded-full border border-emerald-200 hover:bg-emerald-50 transition-all flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-sky-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-sky-500" />
                  </div>
                  <h2 className="font-bold text-[#2E3A59] text-lg">Today's Schedule</h2>
                </div>
                <Link href="/doctor/schedule">
                  <span className="text-xs text-sky-500 hover:text-sky-600 font-semibold transition-colors flex items-center gap-1">
                    Full schedule <ChevronRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>

              {todaysAppointments.length > 0 ? (
                <div className="divide-y divide-sky-50">
                  {todaysAppointments.map((appt, index) => {
                    const isNext = nextAppointment?.id === appt.id;
                    return (
                      <div key={appt.id}
                        className={`flex items-center gap-4 px-6 py-4 transition-colors
                          ${isNext ? "bg-sky-50 border-l-4 border-sky-400" : "hover:bg-sky-50/40"}`}>
                        <div className="w-16 flex-shrink-0 text-center">
                          <p className="text-sm font-bold text-[#2E3A59]">
                            {new Date(appt.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                          </p>
                          <p className="text-xs text-gray-400">{appt.duration}min</p>
                        </div>

                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-200 to-blue-200
                          flex items-center justify-center text-sky-700 font-bold text-sm flex-shrink-0">
                          {appt.patient.firstName[0]}{appt.patient.lastName[0]}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#2E3A59] text-sm truncate">
                            {appt.patient.firstName} {appt.patient.lastName}
                          </p>
                          <p className="text-gray-400 text-xs truncate">
                            {appt.type} · {appt.reasonForVisit}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full border
                            ${appt.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : appt.status === "pending"
                              ? "bg-amber-50 text-amber-600 border-amber-200"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                            }`}>
                            {appt.status}
                          </span>
                          {appt.status === "pending" && (
                            <button
                              onClick={() => confirmAppt.mutate({ id: appt.id, status: "confirmed" })}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1
                                rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Confirm
                            </button>
                          )}
                          <button className="text-xs font-bold text-sky-500 hover:text-sky-700 px-2 py-1
                            rounded-lg hover:bg-sky-50 transition-colors">
                            {isNext ? "Start" : "View"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No appointments today</p>
                  <p className="text-gray-400 text-sm mt-1">Enjoy your free day!</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-sky-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-sky-500" />
                  </div>
                  <h2 className="font-bold text-[#2E3A59] text-lg">Recent Patients</h2>
                </div>
                <Link href="/doctor/patients">
                  <span className="text-xs text-sky-500 hover:text-sky-600 font-semibold transition-colors flex items-center gap-1">
                    View all <ChevronRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>

              {recentPatients.length > 0 ? (
                <div className="divide-y divide-sky-50">
                  {recentPatients.map(appt => (
                    <div key={appt.id} className="flex items-center gap-4 px-6 py-4 hover:bg-sky-50/40 transition-colors">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-200 to-blue-200
                        flex items-center justify-center text-sky-700 font-bold flex-shrink-0">
                        {appt.patient.firstName[0]}{appt.patient.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#2E3A59] text-sm">
                          {appt.patient.firstName} {appt.patient.lastName}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Last visit: {new Date(appt.date).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })}
                        </p>
                      </div>
                      <Link href={`/doctor/patient-records/${appt.patient.id}`}>
                        <button className="text-xs font-bold text-sky-500 hover:text-sky-700 px-3 py-1.5
                          rounded-xl border border-sky-100 hover:border-sky-300 hover:bg-sky-50 transition-all flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Records
                        </button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-gray-400 text-sm">No patient records yet</div>
              )}
            </div>
          </div>

          <div className="space-y-5">

            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-sky-50">
                <h2 className="font-bold text-[#2E3A59]">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-2">
                <Link href="/doctor/schedule">
                  <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-50 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                      <Calendar className="h-4 w-4 text-sky-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#2E3A59] text-sm">My Schedule</p>
                      <p className="text-gray-400 text-xs">Appointments & availability</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-sky-300 ml-auto" />
                  </div>
                </Link>
                <Link href="/doctor/patients">
                  <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-50 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                      <Users className="h-4 w-4 text-sky-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#2E3A59] text-sm">My Patients</p>
                      <p className="text-gray-400 text-xs">{totalPatients} total patients</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-sky-300 ml-auto" />
                  </div>
                </Link>
                <Link href="/doctor/profile">
                  <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-50 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                      <Stethoscope className="h-4 w-4 text-sky-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#2E3A59] text-sm">My Profile</p>
                      <p className="text-gray-400 text-xs">Update your details</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-sky-300 ml-auto" />
                  </div>
                </Link>
                <Link href="/doctor/settings">
                  <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-50 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                      <Settings className="h-4 w-4 text-sky-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#2E3A59] text-sm">Settings</p>
                      <p className="text-gray-400 text-xs">Preferences & security</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-sky-300 ml-auto" />
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-sky-50 flex items-center justify-between">
                <h2 className="font-bold text-[#2E3A59]">Upcoming</h2>
                {upcomingAppointments.length > 0 && (
                  <span className="bg-sky-100 text-sky-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {upcomingAppointments.length}
                  </span>
                )}
              </div>
              <div className="p-4">
                {upcomingAppointments.slice(0, 4).length > 0 ? (
                  <div className="space-y-3">
                    {upcomingAppointments.slice(0, 4).map(appt => (
                      <div key={appt.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-bold text-xs flex-shrink-0">
                          {appt.patient.firstName[0]}{appt.patient.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#2E3A59] truncate">
                            {appt.patient.firstName} {appt.patient.lastName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(appt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {new Date(appt.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                          </p>
                        </div>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0
                          ${appt.status === "confirmed" ? "bg-emerald-400" : "bg-amber-400"}`}/>
                      </div>
                    ))}
                    {upcomingAppointments.length > 4 && (
                      <Link href="/doctor/schedule">
                        <p className="text-xs text-center text-sky-500 hover:text-sky-600 font-semibold pt-1 transition-colors">
                          +{upcomingAppointments.length - 4} more →
                        </p>
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 text-sm py-4">No upcoming appointments</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

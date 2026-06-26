import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Calendar as CalendarIcon, Clock, Users, ChevronRight, Plus, Trash2, Sun, Moon } from "lucide-react";
import { Link } from "wouter";
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
  patient: { id: number; userId: number; firstName: string; lastName: string; };
}

interface Availability {
  id: number;
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Schedule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/doctor-profile"],
    enabled: !!user && user.userType === "doctor",
  });

  const { data: appointments = [], isLoading: apptLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/doctor"],
    enabled: !!user && user.userType === "doctor",
  });

  const { data: availabilityData, isLoading: availLoading, refetch: refetchAvail } = useQuery<any>({
    queryKey: ["/api/doctors", profile?.id, "availability"],
    queryFn: async () => {
      if (!profile?.id) return {};
      const res = await fetch(`/api/doctors/${profile.id}/availability`, { credentials: "include" });
      return res.json();
    },
    enabled: !!profile?.id,
  });

  const selectedDayStr = selectedDate
    ? new Date(selectedDate).toLocaleDateString("en-CA")
    : "";

  const dayAppointments = appointments.filter(a => {
    const d = new Date(a.date).toLocaleDateString("en-CA");
    return d === selectedDayStr;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const appointmentDates = new Set(
    appointments.map(a => new Date(a.date).toLocaleDateString("en-CA"))
  );

  const allSlots: Availability[] = availabilityData
    ? Object.entries(availabilityData).flatMap(([day, slots]: [string, any]) =>
        (slots as any[]).map((s: any) => ({ ...s, dayOfWeek: parseInt(day) }))
      )
    : [];

  const addAvailabilitySlot = async (dayOfWeek: number) => {
    if (!profile) return;
    try {
      const res = await apiRequest("POST", `/api/doctors/${profile.id}/availability`, {
        dayOfWeek, startTime: "09:00", endTime: "09:30", isAvailable: true,
      });
      await res.json();
      refetchAvail();
      toast({ title: "Slot added" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const toggleAvailability = async (slot: Availability) => {
    if (!profile) return;
    try {
      await apiRequest("PATCH", `/api/doctors/${profile.id}/availability/${slot.id}`, {
        isAvailable: !slot.isAvailable,
      });
      refetchAvail();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const deleteAvailability = async (slotId: number) => {
    if (!profile) return;
    try {
      await fetch(`/api/doctors/${profile.id}/availability/${slotId}`, { method: "DELETE", credentials: "include" });
      refetchAvail();
      toast({ title: "Slot removed" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto px-6 py-8 pt-24 space-y-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-white rounded-3xl">
          <div className="absolute -top-8 -right-8 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative px-6 py-10">
            <Link href="/doctor/dashboard" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium mb-3 transition-colors">
              <ChevronRight className="h-4 w-4 rotate-180" /> Back to Dashboard
            </Link>
            <p className="text-white/70 text-sm font-medium mb-1">Doctor Panel</p>
            <h1 className="text-3xl md:text-4xl font-bold">Schedule</h1>
            <p className="text-white/75 mt-1 text-sm">Manage your appointments and weekly availability</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-sky-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="h-4 w-4 text-sky-500" />
                  </div>
                  <h2 className="font-bold text-[#2E3A59] text-lg">
                    {selectedDate ? selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Appointments"}
                  </h2>
                </div>
                <span className="text-xs text-gray-400 font-medium">{dayAppointments.length} appointment{dayAppointments.length !== 1 ? "s" : ""}</span>
              </div>

              {dayAppointments.length > 0 ? (
                <div className="divide-y divide-sky-50">
                  {dayAppointments.map(appt => (
                    <div key={appt.id} className="flex items-center gap-4 px-6 py-4 hover:bg-sky-50/40 transition-colors">
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
                        <p className="text-gray-400 text-xs truncate">{appt.type} · {appt.reasonForVisit}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border flex-shrink-0
                        ${appt.status === "confirmed" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : appt.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                        {appt.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No appointments on this day</p>
                  <p className="text-gray-400 text-sm mt-1">Select a different date to view appointments</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-sky-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center">
                    <Clock className="h-4 w-4 text-sky-500" />
                  </div>
                  <h2 className="font-bold text-[#2E3A59] text-lg">Weekly Availability</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {DAY_NAMES.map((dayName, dayIdx) => {
                  const daySlots = allSlots.filter(s => s.dayOfWeek === dayIdx);
                  return (
                    <div key={dayIdx} className="border border-sky-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-[#2E3A59]">{dayName}</h3>
                        <Button variant="outline" size="sm" className="rounded-xl border-sky-100 text-sky-500"
                          onClick={() => addAvailabilitySlot(dayIdx)}>
                          <Plus className="h-3.5 w-3.5 mr-1" />Add Slot
                        </Button>
                      </div>
                      {daySlots.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {daySlots.map(slot => (
                            <div key={slot.id}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium
                                ${slot.isAvailable ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-gray-100 text-gray-400 border border-gray-200"}`}>
                              <span>{slot.startTime} - {slot.endTime}</span>
                              <button onClick={() => toggleAvailability(slot)} className="hover:opacity-70">
                                {slot.isAvailable ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                              </button>
                              <button onClick={() => deleteAvailability(slot.id)} className="text-red-400 hover:text-red-600">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No slots set for {dayName}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-2xl"
                modifiers={{
                  hasAppointment: (date) => appointmentDates.has(date.toLocaleDateString("en-CA")),
                }}
                modifiersStyles={{
                  hasAppointment: { fontWeight: "bold", backgroundColor: "rgba(56, 189, 248, 0.15)", borderRadius: "8px" },
                }}
              />
            </div>

            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-sky-50">
                <h2 className="font-bold text-[#2E3A59]">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-2">
                <Link href="/doctor/settings">
                  <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-50 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                      <Users className="h-4 w-4 text-sky-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#2E3A59] text-sm">Edit Profile</p>
                      <p className="text-gray-400 text-xs">Update personal details</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-sky-300" />
                  </div>
                </Link>
                <Link href="/doctor/dashboard">
                  <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-50 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                      <CalendarIcon className="h-4 w-4 text-sky-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#2E3A59] text-sm">Dashboard</p>
                      <p className="text-gray-400 text-xs">Back to overview</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-sky-300" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

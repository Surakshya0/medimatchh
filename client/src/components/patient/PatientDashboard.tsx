import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import QuickActionCard from "./QuickActionCard";
import AppointmentsList from "./AppointmentsList";
import RemindersCard from "./RemindersCard";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Search, FileText, Settings, LogOut, Bot, CalendarRange, CalendarCheck, Bell } from "lucide-react";

import type { Appointment } from "./AppointmentsList";
import type { Reminder } from "./RemindersCard";

export default function PatientDashboard() {
  const { user, profile, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const [newAppointmentDate, setNewAppointmentDate] = useState("");

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/patient"],
    enabled: !!user,
  });

  const { data: healthRecords, isLoading: isLoadingHealthRecords } = useQuery({
    queryKey: ["/api/health-records"],
    enabled: !!user,
  });

  const { data: reminders, isLoading: isLoadingReminders } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
    enabled: !!user,
  });

  const isLoading = isLoadingAppointments || isLoadingHealthRecords || isLoadingReminders;

  const handleReschedule = (appointment: Appointment) => {
    setAppointmentToReschedule(appointment);
    setNewAppointmentDate(appointment.date.slice(0, 16));
    setRescheduleDialogOpen(true);
  };

  const confirmReschedule = () => {
    setRescheduleDialogOpen(false);
    setAppointmentToReschedule(null);
    setNewAppointmentDate("");
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysAppointments = (appointments || [])
    .filter(a => { const d = new Date(a.date); d.setHours(0, 0, 0, 0); return d.getTime() === today.getTime(); })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingCount = (appointments || []).filter(a => new Date(a.date) > new Date() && a.status !== "cancelled").length;
  const recordsCount = Array.isArray(healthRecords) ? healthRecords.length : 0;
  const remindersCount = (reminders || []).filter(r => !r.isCompleted).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-5xl mx-auto animate-pulse space-y-6">
          <div className="h-32 bg-sky-100 rounded-3xl" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-sky-100 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 h-64 bg-sky-100 rounded-3xl" />
            <div className="h-64 bg-sky-100 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 pt-24">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-white">
        <div className="absolute -top-8 -right-8 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative max-w-5xl mx-auto px-6 py-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">Hello, {user?.firstName}!</h1>
            <p className="text-white/75 mt-1 text-sm">
              {todaysAppointments.length === 0
                ? "No appointments scheduled for today"
                : `You have ${todaysAppointments.length} appointment${todaysAppointments.length !== 1 ? "s" : ""} today`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/patient/settings")} className="text-white/70 hover:text-white transition-colors p-2" title="Settings">
              <Settings className="h-5 w-5" />
            </button>
            <button onClick={logout} className="text-white/70 hover:text-white transition-colors p-2" title="Log Out">
              <LogOut className="h-5 w-5" />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* 4 stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-sky-400 to-blue-500 text-white rounded-3xl p-5 shadow-sm">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-3"><Calendar className="h-5 w-5" /></div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Today</p>
            <p className="text-3xl font-bold mt-0.5">{todaysAppointments.length}</p>
            <p className="text-white/70 text-xs mt-1">appointments</p>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-sm">
            <div className="w-10 h-10 bg-sky-50 rounded-2xl flex items-center justify-center mb-3"><CalendarRange className="h-5 w-5 text-sky-400" /></div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Upcoming</p>
            <p className="text-3xl font-bold text-[#2E3A59] mt-0.5">{upcomingCount}</p>
            <p className="text-gray-400 text-xs mt-1">scheduled</p>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-sm">
            <div className="w-10 h-10 bg-sky-50 rounded-2xl flex items-center justify-center mb-3"><FileText className="h-5 w-5 text-sky-400" /></div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Records</p>
            <p className="text-3xl font-bold text-[#2E3A59] mt-0.5">{recordsCount}</p>
            <p className="text-gray-400 text-xs mt-1">health records</p>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-sm">
            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center mb-3"><Bell className="h-5 w-5 text-amber-500" /></div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Reminders</p>
            <p className="text-3xl font-bold text-[#2E3A59] mt-0.5">{remindersCount}</p>
            <p className="text-gray-400 text-xs mt-1">active</p>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - appointments & AI checker */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointments */}
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-sky-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center"><CalendarCheck className="h-4 w-4 text-sky-400" /></div>
                  <h2 className="font-bold text-[#2E3A59] text-lg">Your Upcoming Appointments</h2>
                </div>
                <Link href="/patient/appointments">
                  <span className="text-xs text-sky-400 hover:text-sky-600 font-semibold transition-colors">View all →</span>
                </Link>
              </div>
              <div className="p-6">
                <AppointmentsList appointments={appointments || []} onReschedule={handleReschedule} />
              </div>
            </div>

            {/* AI Symptom Checker */}
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-sky-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center"><Bot className="h-4 w-4 text-sky-400" /></div>
                  <h2 className="font-bold text-[#2E3A59] text-lg">AI Symptom Checker</h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-4">
                  Use our AI-powered symptom checker to suggest conditions and find the best doctor match.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/patient/ai-checker" className="flex-1">
                    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white text-sm font-bold hover:shadow-md hover:shadow-sky-200 transition-all duration-150">
                      Open AI Checker
                    </button>
                  </Link>
                  <Link href="/patient/ai-checker" className="flex-1">
                    <button className="w-full py-3 rounded-xl border border-sky-100 text-gray-700 text-sm font-semibold hover:border-sky-300 hover:bg-sky-50 transition-all duration-150">
                      AI Checker
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Quick actions */}
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-sky-50">
                <h2 className="font-bold text-[#2E3A59]">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-2">
                <Link href="/patient/ai-checker">
                  <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-50 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center text-base group-hover:bg-sky-100 transition-colors"><Search className="h-4 w-4 text-sky-400" /></div>
                    <div>
                      <p className="font-semibold text-[#2E3A59] text-sm">AI Checker</p>
                      <p className="text-gray-400 text-xs">Check your symptoms</p>
                    </div>
                    <span className="ml-auto text-sky-300 text-sm">→</span>
                  </div>
                </Link>
                <Link href="/patient/appointments">
                  <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-50 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center group-hover:bg-sky-100 transition-colors"><Calendar className="h-4 w-4 text-sky-400" /></div>
                    <div>
                      <p className="font-semibold text-[#2E3A59] text-sm">Appointments</p>
                      <p className="text-gray-400 text-xs">View your schedule</p>
                    </div>
                    <span className="ml-auto text-sky-300 text-sm">→</span>
                  </div>
                </Link>
                <Link href="/patient/health-records">
                  <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-50 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center text-base group-hover:bg-sky-100 transition-colors"><FileText className="h-4 w-4 text-sky-400" /></div>
                    <div>
                      <p className="font-semibold text-[#2E3A59] text-sm">Health Records</p>
                      <p className="text-gray-400 text-xs">View medical history</p>
                    </div>
                    <span className="ml-auto text-sky-300 text-sm">→</span>
                  </div>
                </Link>
                <Link href="/patient/settings">
                  <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-50 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center text-base group-hover:bg-sky-100 transition-colors"><Settings className="h-4 w-4 text-sky-400" /></div>
                    <div>
                      <p className="font-semibold text-[#2E3A59] text-sm">Settings</p>
                      <p className="text-gray-400 text-xs">Preferences & security</p>
                    </div>
                    <span className="ml-auto text-sky-300 text-sm">→</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Reminders */}
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-sky-50">
                <h2 className="font-bold text-[#2E3A59]">Your Reminders</h2>
              </div>
              <div className="p-4">
                <RemindersCard reminders={reminders || []} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for your appointment with Dr. {appointmentToReschedule?.doctor?.firstName} {appointmentToReschedule?.doctor?.lastName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="new-date" className="text-right text-sm">Date & Time</label>
              <input id="new-date" type="datetime-local" value={newAppointmentDate}
                onChange={(e) => setNewAppointmentDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="col-span-3 p-2 border border-sky-100 rounded-xl text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}
              className="rounded-xl">Cancel</Button>
            <Button onClick={confirmReschedule} disabled={!newAppointmentDate}
              className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white">Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

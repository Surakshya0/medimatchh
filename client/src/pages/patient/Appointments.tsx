import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Calendar, Clock, Video, MapPin, CalendarX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Doctor {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  specialty: string;
}

interface SymptomWithDuration {
  name: string;
  duration: string;
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
  notes?: string;
  symptoms?: string[];
  doctor?: Doctor;
}

export default function Appointments() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("upcoming");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const [newAppointmentDate, setNewAppointmentDate] = useState<string>("");

  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/patient"],
    enabled: !!isAuthenticated && user?.userType === "patient",
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }), credentials: 'include',
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to cancel appointment');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Appointment cancelled', description: 'Your appointment has been successfully cancelled.' });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/patient"] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to cancel appointment', description: error.message, variant: 'destructive' });
    },
  });

  const rescheduleAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, newDate }: { appointmentId: number, newDate: string }) => {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate }), credentials: 'include',
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to reschedule appointment');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Appointment rescheduled', description: 'Your appointment has been successfully rescheduled.' });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/patient"] });
      setRescheduleDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to reschedule appointment', description: error.message, variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
    else if (!isLoading && isAuthenticated && user?.userType !== "patient") setLocation("/doctor/dashboard");
  }, [isAuthenticated, isLoading, user, setLocation]);

  const filterAppointments = (): Appointment[] => {
    const today = new Date();
    if (activeTab === "upcoming") {
      return (appointments as Appointment[])
        .filter((appointment) => new Date(appointment.date) >= today && appointment.status !== "cancelled")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (activeTab === "past") {
      return (appointments as Appointment[])
        .filter((appointment) => new Date(appointment.date) < today && appointment.status !== "cancelled")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (activeTab === "cancelled") {
      return (appointments as Appointment[])
        .filter((appointment) => appointment.status === "cancelled")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return appointments as Appointment[];
  };

  const handleCancelAppointment = (appointmentId: number) => {
    setAppointmentToCancel(appointmentId);
    setCancelDialogOpen(true);
  };

  const confirmCancelAppointment = () => {
    if (appointmentToCancel) { cancelAppointmentMutation.mutate(appointmentToCancel); setCancelDialogOpen(false); }
  };

  const handleRescheduleAppointment = (appointment: Appointment) => {
    setAppointmentToReschedule(appointment);
    setNewAppointmentDate(new Date(appointment.date).toISOString().slice(0, 16));
    setRescheduleDialogOpen(true);
  };

  const confirmRescheduleAppointment = () => {
    if (appointmentToReschedule && newAppointmentDate) {
      rescheduleAppointmentMutation.mutate({ appointmentId: appointmentToReschedule.id, newDate: new Date(newAppointmentDate).toISOString() });
    }
  };

  const filteredAppointments = filterAppointments();

  const parseSymptoms = (symptoms?: string[]): SymptomWithDuration[] => {
    if (!symptoms || symptoms.length === 0) return [];
    try {
      return symptoms.map(symptomStr => {
        try { return JSON.parse(symptomStr); }
        catch { return { name: symptomStr, duration: 'Not specified' }; }
      });
    } catch { return []; }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return <Badge className="bg-emerald-100 text-emerald-600 border-emerald-200 hover:bg-emerald-100">Confirmed</Badge>;
      case "pending": return <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>;
      case "completed": return <Badge className="bg-sky-100 text-sky-600 border-sky-200 hover:bg-sky-100">Completed</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading || isLoadingAppointments) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
        <div className="max-w-5xl mx-auto px-6 py-8 pt-24 animate-pulse space-y-6">
          <div className="h-32 bg-sky-100 rounded-3xl" />
          <div className="h-64 bg-sky-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.userType !== "patient") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-6 py-8 pt-24 space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-white rounded-3xl">
          <div className="absolute -top-8 -right-8 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative px-6 py-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">Patient Panel</p>
              <h1 className="text-3xl md:text-4xl font-bold">My Appointments</h1>
              <p className="text-white/75 mt-1 text-sm">
                {filteredAppointments.length} {activeTab} appointment{filteredAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/patient/dashboard">
                <div className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </div>
              </Link>
              <Button onClick={() => setLocation("/patient/ai-checker")}
                className="bg-white text-sky-500 hover:bg-sky-50 rounded-xl shadow-sm">
                AI Checker
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden p-1">
          <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-sky-50/50 rounded-2xl p-1">
              <TabsTrigger value="upcoming" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Upcoming</TabsTrigger>
              <TabsTrigger value="past" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Past</TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Appointment list */}
        <div className="space-y-4">
          {filteredAppointments.length > 0 ? filteredAppointments.map((appointment: Appointment) => (
            <div key={appointment.id} className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-200 to-blue-200 flex items-center justify-center text-sky-700 font-bold text-base flex-shrink-0">
                      {appointment.doctor?.firstName?.[0]}{appointment.doctor?.lastName?.[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2E3A59] text-lg">
                        Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                      </h3>
                      <p className="text-sm text-gray-400">{appointment.doctor?.specialty}</p>
                    </div>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4 text-sky-400" />
                    <span>{formatDate(new Date(appointment.date))}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="h-4 w-4 text-sky-400" />
                    <span>{appointment.duration} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="h-4 w-4 text-sky-400" />
                    <span>In-person</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="h-4 w-4 text-sky-400" />
                    <span className="truncate">{appointment.reasonForVisit}</span>
                  </div>
                </div>

                {appointment.symptoms && appointment.symptoms.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-sky-50">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Reported Symptoms</p>
                    <div className="flex flex-wrap gap-2">
                      {parseSymptoms(appointment.symptoms).map((symptom, index) => (
                        <span key={index} className="text-xs bg-sky-50 text-sky-600 px-2.5 py-1 rounded-full border border-sky-100">
                          {symptom.name} <span className="text-sky-300">({symptom.duration})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {new Date(appointment.date) > new Date() && appointment.status !== "cancelled" && (
                <div className="px-6 py-4 bg-sky-50/30 border-t border-sky-50 flex gap-3">
                  <Button variant="outline" onClick={() => handleRescheduleAppointment(appointment)}
                    disabled={rescheduleAppointmentMutation.isPending}
                    className="rounded-xl border-sky-100 text-sky-600 hover:bg-sky-50">Reschedule</Button>
                  <Button variant="outline" onClick={() => handleCancelAppointment(appointment.id)}
                    disabled={cancelAppointmentMutation.isPending}
                    className="rounded-xl border-red-100 text-red-500 hover:bg-red-50">Cancel</Button>
                </div>
              )}
              {new Date(appointment.date) < new Date() && appointment.status !== "cancelled" && (
                <div className="px-6 py-4 bg-sky-50/30 border-t border-sky-50 flex gap-3">
                  <Button className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm" onClick={() => setLocation("/patient/ai-checker")}>AI Checker</Button>
                  <Button variant="outline" className="rounded-xl border-sky-100 text-sky-600 hover:bg-sky-50" onClick={() => toast({ title: "Coming soon", description: "Appointment summary view is under development" })}>View Summary</Button>
                </div>
              )}
            </div>
          )) : (
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-12 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-sky-50 text-sky-400 mb-4"><CalendarX className="h-8 w-8" /></div>
              <h3 className="text-lg font-bold text-[#2E3A59] mb-2">No appointments found</h3>
              <p className="text-gray-400 text-sm mb-6">
                {activeTab === "upcoming" ? "You don't have any upcoming appointments scheduled."
                  : activeTab === "past" ? "You don't have any past appointments."
                  : "You don't have any cancelled appointments."}
              </p>
              {activeTab === "upcoming" && (
                <Button onClick={() => setLocation("/patient/ai-checker")}
                  className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm">Try AI Checker</Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Alert Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to cancel this appointment? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">No, Keep Appointment</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelAppointment}
              className="bg-red-500 hover:bg-red-600 rounded-xl">Yes, Cancel Appointment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <Button onClick={confirmRescheduleAppointment}
              disabled={!newAppointmentDate || rescheduleAppointmentMutation.isPending}
              className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white">
              {rescheduleAppointmentMutation.isPending ? 'Rescheduling...' : 'Reschedule Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

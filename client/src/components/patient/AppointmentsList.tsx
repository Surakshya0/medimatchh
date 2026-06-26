import { Link } from "wouter";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export interface Doctor {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  specialty: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  date: string;
  duration: number;
  status: string;
  type: string;
  reasonForVisit: string;
  notes?: string;
  doctor?: Doctor;
}

interface AppointmentsListProps {
  appointments: Appointment[];
  onReschedule?: (appointment: Appointment) => void;
}

export default function AppointmentsList({ appointments, onReschedule }: AppointmentsListProps) {
  const upcomingAppointments = appointments
    .filter(appointment => new Date(appointment.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-3">
      {upcomingAppointments.length > 0 ? upcomingAppointments.map((appointment) => (
        <div key={appointment.id} className="flex items-center gap-4 p-4 hover:bg-sky-50/40 transition-colors rounded-2xl border border-transparent hover:border-sky-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-200 to-blue-200 flex items-center justify-center text-sky-700 font-bold text-sm flex-shrink-0">
            {appointment.doctor?.firstName?.[0]}{appointment.doctor?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#2E3A59] text-sm">
              Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
            </p>
            <p className="text-gray-400 text-xs">{appointment.doctor?.specialty}</p>
            <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(new Date(appointment.date))}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{appointment.type}</span>
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" className="text-xs rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm">
              {appointment.type}
            </Button>
            <Button size="sm" variant="outline" className="text-xs rounded-xl border-sky-100 text-sky-600 hover:bg-sky-50"
              onClick={() => onReschedule && onReschedule(appointment)}>
              Reschedule
            </Button>
          </div>
        </div>
      )) : (
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm mb-4">You don't have any upcoming appointments.</p>
          <Link href="/patient/ai-checker">
            <Button className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white">Try AI Symptom Checker</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

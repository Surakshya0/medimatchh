import { Link } from "wouter";
import { Clock, Calendar, Edit, AlertTriangle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export interface Reminder {
  id: number;
  patientId: number;
  title: string;
  description?: string;
  date: string;
  isCompleted: boolean;
  type: string;
}

interface RemindersCardProps {
  reminders: Reminder[];
}

export default function RemindersCard({ reminders }: RemindersCardProps) {
  const activeReminders = reminders
    .filter(reminder => !reminder.isCompleted)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const getReminderIcon = (type: string) => {
    const props = "h-4 w-4 text-amber-500";
    switch (type.toLowerCase()) {
      case 'medication': return <Clock className={props} />;
      case 'appointment': return <Calendar className={props} />;
      case 'questionnaire': return <Edit className={props} />;
      default: return <AlertTriangle className={props} />;
    }
  };

  return (
    <div className="space-y-3">
      {activeReminders.length > 0 ? activeReminders.map((reminder) => (
        <div key={reminder.id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-amber-50/40 transition-colors">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            {getReminderIcon(reminder.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#2E3A59]">{reminder.title}</p>
            {reminder.description && <p className="text-xs text-gray-400">{reminder.description}</p>}
            <p className="text-xs text-gray-400 mt-1">{formatDate(new Date(reminder.date))}</p>
          </div>
        </div>
      )) : (
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm">No reminders to display.</p>
        </div>
      )}
      <Link href="#">
        <Button variant="outline" className="w-full mt-2 rounded-xl border-sky-100 text-sky-600 hover:bg-sky-50">
          <Bell className="h-4 w-4 mr-2" />Manage Reminders
        </Button>
      </Link>
    </div>
  );
}

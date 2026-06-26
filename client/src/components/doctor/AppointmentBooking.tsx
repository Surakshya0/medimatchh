import { useState } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

interface Doctor {
  id: number;
  userId: number;
  specialty: string;
  hospitalAffiliation: string;
  experience: number;
  rating: number;
  reviewCount: number;
  firstName: string;
  lastName: string;
}

interface AppointmentBookingProps {
  doctorId: number;
}

export default function AppointmentBooking({ doctorId }: AppointmentBookingProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState("in-person");
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [notes, setNotes] = useState("");
  const [useInsurance, setUseInsurance] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get doctor data
  const { data: doctor, isLoading: isLoadingDoctor } = useQuery<Doctor>({
    queryKey: [`/api/doctors/${doctorId}`],
    enabled: !!doctorId,
  });

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/appointments", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment booked successfully",
        description: "You can view your appointments in the dashboard",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/patient"] });
      setLocation("/patient/appointments");
    },
    onError: (error) => {
      toast({
        title: "Failed to book appointment",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  if (isLoadingDoctor) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse max-w-5xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow-md p-6 h-96"></div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">Doctor Not Found</h2>
            <p className="text-neutral-600 mb-6">The doctor you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => setLocation("/patient/ai-checker")}>
              AI Checker
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Generate days for calendar
  const generateCalendarDays = () => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Create a date for the first day of the month
    const firstDay = new Date(year, month, 1);
    // Create a date for the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week of the first day (0-6, 0 is Sunday)
    const firstDayIndex = firstDay.getDay();
    
    // Empty cells for days of the previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, disabled: true });
    }
    
    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const isPast = date < today;
      days.push({ day: i, disabled: isPast, date });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  
  // Mock time slots (in a real app these would come from the doctor's availability)
  const timeSlots = [
    "9:00 AM", "10:30 AM", "11:45 AM", "1:15 PM", 
    "2:30 PM", "3:45 PM", "4:15 PM", "5:30 PM"
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(""); // Reset time when date changes
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime || !appointmentType || !reasonForVisit || !profile) {
      toast({
        title: "Please complete all fields",
        description: "All appointment details are required",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time
    const [hours, minutes] = selectedTime.split(':');
    const isPM = selectedTime.includes('PM');
    let hour = parseInt(hours);
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hour, parseInt(minutes), 0, 0);

    const appointmentData = {
      patientId: profile?.id,
      doctorId: doctor.id,
      date: appointmentDate.toISOString(),
      duration: 30, // 30 minutes by default
      status: "pending",
      type: appointmentType,
      reasonForVisit,
      notes: notes || undefined,
      symptoms: [], // We would use the symptoms from search, but keeping it simple
    };

    bookAppointmentMutation.mutate(appointmentData);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-6">
          <button 
            className="mr-3 text-neutral-600 hover:text-primary-500"
            onClick={() => setLocation("/patient/ai-checker")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-neutral-800">Book Appointment</h1>
        </div>

        <Card className="mb-6">
          {/* Doctor info */}
          <CardContent className="p-6 border-b border-neutral-100">
            <div className="flex items-start">
              <div className="h-16 w-16 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center text-xl font-medium mr-4">
                {doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-800">Dr. {doctor.firstName} {doctor.lastName}</h2>
                <p className="text-sm text-neutral-600">{doctor.specialty} • {doctor.hospitalAffiliation || 'Independent Practice'}</p>
                <div className="flex items-center mt-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < (doctor.rating || 0) ? 'text-yellow-400 fill-current' : 'text-neutral-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="ml-1 text-sm text-neutral-600">
                    {doctor.rating?.toFixed(1) || "N/A"} ({doctor.reviewCount || 0} reviews)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>

          {/* Calendar */}
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-4">Select Date & Time</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calendar View */}
              <div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-neutral-800">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    <div className="flex space-x-2">
                      <button 
                        className="p-1 rounded-full hover:bg-neutral-100"
                        onClick={handlePrevMonth}
                      >
                        <ChevronLeft className="h-5 w-5 text-neutral-600" />
                      </button>
                      <button 
                        className="p-1 rounded-full hover:bg-neutral-100"
                        onClick={handleNextMonth}
                      >
                        <ChevronRight className="h-5 w-5 text-neutral-600" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-xs font-medium text-neutral-600 py-2">{day}</div>
                    ))}
                    
                    {calendarDays.map((dayObj, i) => (
                      <div 
                        key={i} 
                        className={`calendar-day h-9 flex items-center justify-center text-sm rounded-full ${
                          dayObj.disabled 
                            ? 'calendar-day-disabled' 
                            : 'hover:bg-primary-100 cursor-pointer'
                        } ${
                          selectedDate && dayObj.date && 
                          selectedDate.getDate() === dayObj.date.getDate() && 
                          selectedDate.getMonth() === dayObj.date.getMonth() &&
                          selectedDate.getFullYear() === dayObj.date.getFullYear()
                            ? 'calendar-day-selected'
                            : ''
                        }`}
                        onClick={() => dayObj.day && !dayObj.disabled && dayObj.date && handleDateSelect(dayObj.date)}
                      >
                        {dayObj.day}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Time Slots */}
              <div>
                <h4 className="font-medium text-neutral-800 mb-4">
                  {selectedDate 
                    ? `Available Times for ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` 
                    : 'Select a date first'}
                </h4>
                
                {selectedDate ? (
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((time) => (
                      <button 
                        key={time}
                        className={`text-center py-2 border rounded-md transition-colors ${
                          selectedTime === time
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50'
                        }`}
                        onClick={() => handleTimeSelect(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 bg-neutral-50 rounded-md border border-neutral-200">
                    <p className="text-neutral-600">Please select a date from the calendar</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          
          {/* Appointment Form */}
          <CardContent className="p-6 border-t border-neutral-100">
            <h3 className="text-lg font-medium text-neutral-800 mb-4">Appointment Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label htmlFor="appointment-type" className="block text-sm font-medium text-neutral-700 mb-1">
                    Appointment Type
                  </label>
                  <Select
                    value={appointmentType}
                    onValueChange={setAppointmentType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select appointment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">In-Person Visit</SelectItem>
                      <SelectItem value="video">Video Consultation</SelectItem>
                      <SelectItem value="phone">Phone Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="visit-reason" className="block text-sm font-medium text-neutral-700 mb-1">
                    Reason for Visit
                  </label>
                  <Select
                    value={reasonForVisit}
                    onValueChange={setReasonForVisit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason for visit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="follow-up">Follow-up Visit</SelectItem>
                      <SelectItem value="new-patient">New Patient Visit</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <div className="mb-4">
                  <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <Textarea
                    id="notes"
                    rows={4}
                    placeholder="Any additional information you'd like to share..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="border-t border-neutral-100 pt-4 mt-4">
              <div className="flex items-center mb-4">
                <input 
                  id="insurance" 
                  type="checkbox" 
                  className="h-4 w-4 border-neutral-300 rounded text-primary-500 focus:ring-primary-500"
                  checked={useInsurance}
                  onChange={(e) => setUseInsurance(e.target.checked)}
                />
                <label htmlFor="insurance" className="ml-2 block text-sm text-neutral-700">
                  I'll be using my health insurance
                </label>
              </div>
              
              <div className="md:flex justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <p className="text-neutral-600 text-sm">Selected Appointment:</p>
                  {selectedDate && selectedTime ? (
                    <p className="font-medium">
                      {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {selectedTime} with Dr. {doctor.firstName} {doctor.lastName}
                    </p>
                  ) : (
                    <p className="text-neutral-500">Please select date and time</p>
                  )}
                </div>
                
                <Button
                  className="w-full md:w-auto"
                  onClick={handleBookAppointment}
                  disabled={!selectedDate || !selectedTime || !appointmentType || !reasonForVisit || bookAppointmentMutation.isPending}
                >
                  {bookAppointmentMutation.isPending ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">↻</span> Booking...
                    </span>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper component for stars
function Star({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

// Helper component for chevron icons
function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  );
}

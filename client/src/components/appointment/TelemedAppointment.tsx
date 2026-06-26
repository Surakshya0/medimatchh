import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays, startOfDay, setHours, setMinutes, isBefore } from 'date-fns';
import { CalendarDays, Clock, Users, Stethoscope, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';

import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

// Type for the doctor object
interface Doctor {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  specialty: string;
  hospitalAffiliation: string;
  experience: number;
  rating: number;
  reviewCount: number;
  matchScore?: number;
  symptomMatches?: number;
}

// Type for the availability time slot
interface TimeSlot {
  id: number;
  startTime: string;
  endTime: string;
}

// Type for the form data
const appointmentSchema = z.object({
  patientId: z.number({
    required_error: "Patient ID is required",
    invalid_type_error: "Patient ID must be a number"
  }).optional(),
  doctorId: z.number({
    required_error: "Doctor ID is required",
    invalid_type_error: "Doctor ID must be a number"
  }),
  date: z.date({
    required_error: "Appointment date is required",
    invalid_type_error: "Invalid date format"
  }).refine(
    (date) => date > new Date(),
    {
      message: "Appointment date must be in the future"
    }
  ),
  duration: z.number({
    invalid_type_error: "Duration must be a number"
  }).min(15, "Appointment must be at least 15 minutes").max(120, "Appointment cannot exceed 2 hours").default(30),
  type: z.enum(['in-person', 'video'], {
    required_error: "Appointment type is required",
    invalid_type_error: "Invalid appointment type"
  }).default('video'),
  status: z.string().default('pending'),
  reasonForVisit: z.string()
    .min(5, "Please provide a more detailed reason for your visit")
    .max(500, "Reason for visit is too long (maximum 500 characters)")
    .refine(value => value.trim().length > 0, {
      message: "Reason for visit cannot be empty"
    }),
  symptoms: z.array(
    z.object({
      name: z.string().min(2, "Symptom name is too short"),
      duration: z.string().min(1, "Please specify symptom duration")
    }),
    {
      invalid_type_error: "Invalid symptoms format"
    }
  ).default([]),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface TelemedAppointmentProps {
  doctorId?: string;
}

export function TelemedAppointment({ doctorId }: TelemedAppointmentProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(addDays(new Date(), 1)));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [appointmentType, setAppointmentType] = useState<'video' | 'in-person'>('in-person');
  const { profile, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Log the received doctorId for debugging
  useEffect(() => {
    console.log('TelemedAppointment received doctorId:', doctorId);
  }, [doctorId]);

  // Convert doctorId from string to number, handling null/undefined
  // Use default state of 0 (invalid ID) if doctorId is falsy/NaN
  const doctorIdNum = doctorId && !isNaN(parseInt(doctorId)) ? parseInt(doctorId) : 0;

  // Check if user is logged in and is a patient
  useEffect(() => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book an appointment",
        variant: "destructive"
      });
      setLocation('/login');
    } else if (user.userType !== 'patient') {
      toast({
        title: "Access Denied",
        description: "Only patients can book appointments",
        variant: "destructive"
      });
      setLocation('/');
    }
  }, [user, setLocation, toast]);

  // Fetch doctor details
  // Add debug log about doctorId being used for API calls
  useEffect(() => {
    console.log('Using doctorId in API calls:', doctorIdNum);
  }, [doctorIdNum]);

  const { data: doctor, isLoading: isLoadingDoctor } = useQuery({
    queryKey: ['/api/doctors', doctorIdNum],
    queryFn: async () => {
      const response = await fetch(`/api/doctors/${doctorIdNum}`);
      if (!response.ok) throw new Error('Failed to fetch doctor');
      return response.json();
    },
    enabled: !!doctorIdNum && !isNaN(doctorIdNum)
  });

  // Define TimeSlot interface
  interface TimeSlot {
    id: number;
    startTime: string;
    endTime: string;
  }

  // Fetch doctor availability
  const { data: availabilityData, isLoading: isLoadingAvailability } = useQuery<Record<number, TimeSlot[]>>({
    queryKey: ['/api/doctors', doctorIdNum, 'availability'],
    queryFn: async () => {
      const response = await fetch(`/api/doctors/${doctorIdNum}/availability`);
      if (!response.ok) throw new Error('Failed to fetch availability');
      return response.json();
    },
    enabled: !!doctorIdNum && !isNaN(doctorIdNum)
  });


  // Form setup
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: profile?.id,
      doctorId: doctorIdNum,
      duration: 30,
      type: 'in-person',
      status: 'pending',
      reasonForVisit: '',
      symptoms: [],
    }
  });
  
  // Update patientId when profile loads and doctorId when prop changes
  useEffect(() => {
    // Update patientId if profile exists
    if (profile?.id) {
      form.setValue('patientId', profile.id);
      console.log('Updated patientId in form:', profile.id);
    }
    
    // Update doctorId when prop changes
    if (doctorId) {
      const numDoctorId = parseInt(doctorId);
      if (!isNaN(numDoctorId)) {
        form.setValue('doctorId', numDoctorId);
        console.log('Updated doctorId in form:', numDoctorId);
      }
    }
  }, [profile, doctorId, form]);

  // Debug function to check doctor ID routing
  useEffect(() => {
    if (doctorIdNum) {
      // Make a request to our debug endpoint
      fetch(`/api/debug/doctor-id/${doctorIdNum}`)
        .then(response => response.json())
        .then(data => {
          console.log('Debug doctor ID routing:', data);
        })
        .catch(err => {
          console.error('Error in debug route:', err);
        });
    }
  }, [doctorIdNum]);

  // Update form value when date, time slot, appointment type, or symptoms change
  useEffect(() => {
    if (selectedDate && selectedTimeSlot) {
      const [hours, minutes] = selectedTimeSlot.startTime.split(':').map(Number);
      const appointmentDateTime = setMinutes(setHours(selectedDate, hours), minutes);
      
      // Create appropriate format for the appointment date
      form.setValue('date', appointmentDateTime);
      console.log('Set appointment date to:', appointmentDateTime);
    }
    form.setValue('type', appointmentType);
  }, [selectedDate, selectedTimeSlot, appointmentType, form]);

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormValues) => {
      // All appointments use the same endpoint
      const response = await apiRequest('POST', '/api/appointments', data);
      return response.json();
    },
    onSuccess: (data) => {
      // Format the date and time for the success message
      const appointmentDate = selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'the selected date';
      const appointmentTime = selectedTimeSlot ? `${selectedTimeSlot.startTime} - ${selectedTimeSlot.endTime}` : 'the selected time';
      
      toast({
        title: "Appointment Booked Successfully",
        description: `Your in-person appointment with Dr. ${doctor.firstName} ${doctor.lastName} has been scheduled for ${appointmentDate} at ${appointmentTime}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/patient'] });
      // Redirect to patient dashboard or appointment details page
      setLocation('/patient/appointments');
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "There was a problem booking your appointment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Define a direct form submit handler with improved validation
  const handleDirectSubmit = async () => {
    try {
      // Get all form values directly
      const formData = form.getValues();
      
      // Ensure critical fields are set
      formData.doctorId = doctorIdNum;
      if (profile?.id) {
        formData.patientId = profile.id;
      }
      
      // Ensure date and time are properly set
      if (!selectedDate || !selectedTimeSlot) {
        toast({
          title: "Invalid Appointment Time",
          description: selectedDate ? "Please select a time slot." : "Please select a date for your appointment.",
          variant: "destructive"
        });
        return;
      }
      
      // Check for reason for visit
      if (!formData.reasonForVisit || formData.reasonForVisit.trim().length < 5) {
        toast({
          title: "Reason for Visit Required",
          description: "Please provide a more detailed reason for your visit (at least 5 characters).",
          variant: "destructive"
        });
        return;
      }
      
      // Log the direct submission attempt
      console.log('Direct form submission with data:', formData);
      
      // Perform full schema validation
      const validationResult = appointmentSchema.safeParse(formData);
      
      if (!validationResult.success) {
        // Get formatted validation errors
        const formattedErrors = validationResult.error.format();
        console.error('Validation errors:', formattedErrors);
        
        // Show the first validation error to the user
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError?.message || "Please check your form inputs and try again.",
          variant: "destructive"
        });
        return;
      }
      
      // If validation passes, submit the data
      bookAppointmentMutation.mutate(formData);
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Form Submission Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Original form submit handler
  const onSubmit = (data: AppointmentFormValues) => {
    console.log('Form submission started with data:', data);
    console.log('Form doctorId:', data.doctorId, 'Form patientId:', data.patientId);
    // Ensure patientId is set
    if (!data.patientId && profile?.id) {
      data.patientId = profile.id;
    }
    
    // Log form data for debugging
    console.log('Submitting appointment data:', data);
    console.log('Current profile:', profile);
    
    // Validate required data
    if (!data.patientId) {
      toast({
        title: "Missing Patient Information",
        description: "Patient ID is required to book an appointment. Please try logging out and logging back in.",
        variant: "destructive"
      });
      return;
    }
    
    if (!data.doctorId) {
      toast({
        title: "Missing Doctor Information",
        description: "Doctor ID is required to book an appointment.",
        variant: "destructive"
      });
      return;
    }
    
    // Submit the data
    bookAppointmentMutation.mutate(data);
  };

  // Helper function to get available time slots for selected date
  const getAvailableTimeSlots = () => {
    if (!selectedDate || !availabilityData) {
      // Create dummy availability slots if none are returned from the server
      const timeSlots = [
        { id: 1, startTime: '09:00', endTime: '09:30' },
        { id: 2, startTime: '10:00', endTime: '10:30' },
        { id: 3, startTime: '11:00', endTime: '11:30' },
        { id: 4, startTime: '14:00', endTime: '14:30' },
        { id: 5, startTime: '15:00', endTime: '15:30' },
        { id: 6, startTime: '16:00', endTime: '16:30' }
      ];
      return timeSlots;
    }
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = selectedDate.getDay();
    
    // Return the available slots for the selected day or use dummy data
    const slots = availabilityData[dayOfWeek] || [];
    if (slots.length === 0) {
      // Create dummy availability slots if none are returned for this day
      return [
        { id: 1, startTime: '09:00', endTime: '09:30' },
        { id: 2, startTime: '10:00', endTime: '10:30' },
        { id: 3, startTime: '11:00', endTime: '11:30' },
        { id: 4, startTime: '14:00', endTime: '14:30' },
        { id: 5, startTime: '15:00', endTime: '15:30' },
        { id: 6, startTime: '16:00', endTime: '16:30' }
      ];
    }
    return slots;
  };

  // Check if the date is disabled (in the past only)
  const isDateDisabled = (date: Date) => {
    // Only disable dates in the past
    return isBefore(date, startOfDay(new Date()));
  };

  if (isLoadingDoctor || isLoadingAvailability) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        <span className="ml-2 text-sky-700">Loading...</span>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-8">
        <h2 className="text-2xl font-bold mb-4">Doctor Not Found</h2>
        <p className="text-gray-600">We couldn't find information for the requested doctor.</p>
        <Button
          className="mt-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl"
          onClick={() => setLocation('/patient/dashboard')}
        >
          Back to Doctors
        </Button>
      </div>
    );
  }

  const availableTimeSlots = getAvailableTimeSlots();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-6 py-8 pt-24 space-y-8">

        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-white rounded-3xl">
          <div className="absolute -top-8 -right-8 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative px-6 py-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">Book Appointment</p>
              <h1 className="text-3xl md:text-4xl font-bold">Dr. {doctor.firstName} {doctor.lastName}</h1>
              <p className="text-white/75 mt-1 text-sm">
                Schedule an appointment with {doctor.specialty} specialist
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setLocation('/patient/dashboard')}
                className="text-white/70 hover:text-white hover:bg-white/10 text-sm"
              >
                &larr; Back to Doctors
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Doctor Info Card */}
          <Card className="md:col-span-1 border-sky-100 shadow-sm rounded-3xl">
            <CardHeader>
              {doctor.matchScore && (
                <div className="-mt-3 -mx-6 px-6 py-2 mb-3 bg-gradient-to-r from-sky-400 to-blue-500 text-white">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Match Score: {doctor.matchScore}%</span>
                  </div>
                  <Progress 
                    value={doctor.matchScore} 
                    className="h-1 mt-1 bg-white/20" 
                    indicatorClassName="bg-white" 
                  />
                </div>
              )}
              <CardTitle>Dr. {doctor.firstName} {doctor.lastName}</CardTitle>
              <CardDescription>{doctor.specialty}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Stethoscope className="h-4 w-4 mr-2 text-sky-500" />
                  <span className="text-gray-500 mr-2">Experience:</span>
                  <span>{doctor.experience} years</span>
                </div>
                {doctor.hospitalAffiliation && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-sky-500" />
                    <span className="text-gray-500 mr-2">Hospital:</span>
                    <span>{doctor.hospitalAffiliation}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-sky-500" />
                  <span className="text-gray-500 mr-2">Location:</span>
                  <span>Kathmandu, Nepal</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Licensed by Nepal Medical Council</p>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Booking Form */}
          <div className="md:col-span-2">
            <Card className="border-sky-100 shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle>Select Appointment Type, Date and Time</CardTitle>
                <CardDescription>
                  Choose your preferred appointment type, date and time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Appointment Type */}
                    <div className="space-y-4">
                      <FormLabel>Appointment Type</FormLabel>
                      <div className="flex items-center p-4 border border-sky-100 rounded-xl bg-sky-50">
                        <Users className="h-5 w-5 text-sky-500 mr-2" />
                        <div>
                          <div className="font-medium">In-Person Visit</div>
                          <div className="text-sm text-gray-500">Visit Dr. {doctor.lastName} at {doctor.hospitalAffiliation || 'their clinic'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Date Selection */}
                      <div>
                        <FormLabel>Appointment Date</FormLabel>
                        <div className="mb-4">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal mt-2 border-sky-100 hover:border-sky-300 hover:text-sky-600"
                              >
                                <CalendarDays className="mr-2 h-4 w-4 text-sky-500" />
                                {selectedDate ? (
                                  format(selectedDate, "PP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={isDateDisabled}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Time Slot Selection */}
                      <div>
                        <FormLabel>Appointment Time</FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {availableTimeSlots.length > 0 ? (
                            availableTimeSlots.map((slot) => (
                              <Button
                                key={slot.id}
                                type="button"
                                variant={selectedTimeSlot?.id === slot.id ? "default" : "outline"}
                                className={`justify-start ${
                                  selectedTimeSlot?.id === slot.id
                                    ? "bg-sky-500 hover:bg-sky-600 text-white"
                                    : "border-sky-100 hover:border-sky-300 text-sky-700 hover:text-sky-600"
                                }`}
                                onClick={() => setSelectedTimeSlot(slot)}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                {slot.startTime} - {slot.endTime}
                              </Button>
                            ))
                          ) : (
                            <div className="col-span-2 text-center py-4 text-gray-400">
                              {selectedDate ? (
                                "No time slots available for the selected date."
                              ) : (
                                "Please select a date first."
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Visit Details */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="reasonForVisit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason for Visit</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Please describe your symptoms or reason for the appointment" 
                                className="resize-none border-sky-100 focus:border-sky-300" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Book Appointment button */}
                    <div className="mt-8">
                      <Button 
                        type="button" 
                        className={`w-full py-6 text-lg font-semibold rounded-xl shadow-lg ${
                          !selectedDate || !selectedTimeSlot || bookAppointmentMutation.isPending
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-sky-400 to-blue-500 text-white hover:from-sky-500 hover:to-blue-600 hover:shadow-xl"
                        }`}
                        disabled={!selectedDate || !selectedTimeSlot || bookAppointmentMutation.isPending}
                        onClick={handleDirectSubmit}
                      >
                        {bookAppointmentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Booking Appointment...
                          </>
                        ) : (
                          <>Book Appointment</>
                        )}
                      </Button>
                      <p className="text-sm text-center mt-2 text-gray-400">
                        {!selectedDate ? 'Please select a date' : !selectedTimeSlot ? 'Please select a time slot' : 'Ready to book!'}
                      </p>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, UserPlus, Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const commonSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
});

const patientSchema = commonSchema.extend({
  userType: z.literal("patient"),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  bloodType: z.string().optional(),
});

const doctorSchema = commonSchema.extend({
  userType: z.literal("doctor"),
  specialty: z.string().min(1, { message: "Specialty is required" }),
  experience: z.string().min(1, { message: "Experience is required" }),
  hospitalAffiliation: z.string().optional(),
  education: z.string().optional(),
  licenseNumber: z.string().optional(),
  about: z.string().optional(),
});

const registerSchema = z.discriminatedUnion('userType', [
  patientSchema,
  doctorSchema,
]);

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<"patient" | "doctor">("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [emailReadOnly, setEmailReadOnly] = useState(true);
  const [passwordReadOnly, setPasswordReadOnly] = useState(true);

  const { data: hospitals = [] } = useQuery<string[]>({
    queryKey: ["/api/hospitals"],
    staleTime: 60000,
  });

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userType: "patient",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const userData = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        userType: data.userType,
      };

      let profileData: any = {};

      if (data.userType === "patient") {
        profileData = {
          gender: data.gender || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zipCode: data.zipCode || null,
          bloodType: data.bloodType || null,
        };
      } else {
        profileData = {
          specialty: data.specialty || "",
          experience: data.experience ? parseInt(data.experience, 10) : 0,
          hospitalAffiliation: data.hospitalAffiliation || "",
          education: data.education || null,
          licenseNumber: data.licenseNumber || null,
          acceptingNewPatients: true,
          about: data.about || null,
        };
      }

      await register(userData, profileData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserTypeChange = (value: "patient" | "doctor") => {
    setUserType(value);
    form.setValue("userType", value);
  };

  const specialties = [
    "General Practitioner", "Cardiologist", "Dermatologist", "Neurologist",
    "Pediatrician", "Psychiatrist", "Orthopedist", "Gynecologist",
    "Urologist", "Ophthalmologist", "ENT Specialist", "Endocrinologist"
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EBF5FB] via-[#D6EAF8] to-[#BBDEFB] p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg shadow-[#4AA8F0]/20 mb-5">
            <UserPlus className="w-8 h-8 text-[#4AA8F0]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#2E3A59]">Create Account</h1>
          <p className="text-[#5D6F88] mt-2 text-sm">
            Join MediMatch to connect with healthcare professionals
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-[#4AA8F0]/10 border border-[#D6EAF8] p-8">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mb-6">
            <p className="text-sm font-medium text-[#2E3A59] mb-3">I am a:</p>
            <RadioGroup
              defaultValue="patient"
              value={userType}
              onValueChange={(value) => handleUserTypeChange(value as "patient" | "doctor")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="patient" id="patient" className="text-[#4AA8F0] border-[#D6EAF8]" />
                <label htmlFor="patient" className="cursor-pointer text-sm text-[#2E3A59]">Patient</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="doctor" id="doctor" className="text-[#4AA8F0] border-[#D6EAF8]" />
                <label htmlFor="doctor" className="cursor-pointer text-sm text-[#2E3A59]">Doctor</label>
              </div>
            </RadioGroup>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#2E3A59] font-medium text-sm">First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Bijay" autoComplete="given-name" {...field}
                          className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59] placeholder:text-[#A0B4CC] focus-visible:ring-[#4AA8F0] focus-visible:border-[#4AA8F0] transition-all" />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#2E3A59] font-medium text-sm">Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Sharma" autoComplete="family-name" {...field}
                          className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59] placeholder:text-[#A0B4CC] focus-visible:ring-[#4AA8F0] focus-visible:border-[#4AA8F0] transition-all" />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2E3A59] font-medium text-sm">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" type="email" autoComplete="off" readOnly={emailReadOnly} onFocus={() => setEmailReadOnly(false)} onClick={() => setEmailReadOnly(false)} {...field}
                        className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59] placeholder:text-[#A0B4CC] focus-visible:ring-[#4AA8F0] focus-visible:border-[#4AA8F0] transition-all" />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2E3A59] font-medium text-sm">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="••••••••" type={showPassword ? "text" : "password"} autoComplete="new-password" readOnly={passwordReadOnly} onFocus={() => setPasswordReadOnly(false)} onClick={() => setPasswordReadOnly(false)} {...field}
                          className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59] placeholder:text-[#A0B4CC] focus-visible:ring-[#4AA8F0] focus-visible:border-[#4AA8F0] transition-all pr-10" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0B4CC] hover:text-[#4AA8F0] transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />

              {userType === "patient" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#2E3A59] font-medium text-sm">Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field}
                              className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59] focus-visible:ring-[#4AA8F0] focus-visible:border-[#4AA8F0] transition-all" />
                          </FormControl>
                          <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#2E3A59] font-medium text-sm">Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger
                                className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59] focus:ring-[#4AA8F0]">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#2E3A59] font-medium text-sm">Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+977 98XXXXXXXX" {...field}
                            className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59] placeholder:text-[#A0B4CC] focus-visible:ring-[#4AA8F0] focus-visible:border-[#4AA8F0] transition-all" />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />

                  <Tabs defaultValue="basic">
                    <TabsList className="grid w-full grid-cols-2 rounded-xl bg-[#EBF5FB] p-1">
                      <TabsTrigger value="basic"
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#4AA8F0] data-[state=active]:shadow-sm text-sm">Basic Info</TabsTrigger>
                      <TabsTrigger value="advanced"
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#4AA8F0] data-[state=active]:shadow-sm text-sm">Additional Info</TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic" className="pt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#2E3A59] font-medium text-sm">City</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger
                                    className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59]">
                                    <SelectValue placeholder="Select city" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="kathmandu">Kathmandu</SelectItem>
                                  <SelectItem value="pokhara">Pokhara</SelectItem>
                                  <SelectItem value="lalitpur">Lalitpur</SelectItem>
                                  <SelectItem value="bhaktapur">Bhaktapur</SelectItem>
                                  <SelectItem value="biratnagar">Biratnagar</SelectItem>
                                  <SelectItem value="birgunj">Birgunj</SelectItem>
                                  <SelectItem value="dharan">Dharan</SelectItem>
                                  <SelectItem value="nepalgunj">Nepalgunj</SelectItem>
                                  <SelectItem value="butwal">Butwal</SelectItem>
                                  <SelectItem value="dhangadhi">Dhangadhi</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#2E3A59] font-medium text-sm">Province</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger
                                    className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59]">
                                    <SelectValue placeholder="Select province" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="koshi">Koshi Province</SelectItem>
                                  <SelectItem value="madhesh">Madhesh Province</SelectItem>
                                  <SelectItem value="bagmati">Bagmati Province</SelectItem>
                                  <SelectItem value="gandaki">Gandaki Province</SelectItem>
                                  <SelectItem value="lumbini">Lumbini Province</SelectItem>
                                  <SelectItem value="karnali">Karnali Province</SelectItem>
                                  <SelectItem value="sudurpashchim">Sudurpashchim Province</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="advanced" className="pt-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#2E3A59] font-medium text-sm">Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Kantipath, Ward 12" {...field}
                                className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59] placeholder:text-[#A0B4CC] focus-visible:ring-[#4AA8F0] focus-visible:border-[#4AA8F0] transition-all" />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#2E3A59] font-medium text-sm">Zip Code</FormLabel>
                              <FormControl>
                                <Input placeholder="44600" {...field}
                                  className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59] placeholder:text-[#A0B4CC] focus-visible:ring-[#4AA8F0] focus-visible:border-[#4AA8F0] transition-all" />
                              </FormControl>
                              <FormMessage className="text-xs text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bloodType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#2E3A59] font-medium text-sm">Blood Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger
                                    className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59]">
                                    <SelectValue placeholder="Select blood type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="A+">A+</SelectItem>
                                  <SelectItem value="A-">A-</SelectItem>
                                  <SelectItem value="B+">B+</SelectItem>
                                  <SelectItem value="B-">B-</SelectItem>
                                  <SelectItem value="AB+">AB+</SelectItem>
                                  <SelectItem value="AB-">AB-</SelectItem>
                                  <SelectItem value="O+">O+</SelectItem>
                                  <SelectItem value="O-">O-</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {userType === "doctor" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="specialty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#2E3A59] font-medium text-sm">Specialty</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger
                                className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59]">
                                <SelectValue placeholder="Select specialty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {specialties.map((specialty) => (
                                <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#2E3A59] font-medium text-sm">Experience</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger
                                className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59]">
                                <SelectValue placeholder="Years" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30].map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year} {year === 1 ? "year" : "years"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Tabs defaultValue="basic">
                    <TabsList className="grid w-full grid-cols-2 rounded-xl bg-[#EBF5FB] p-1">
                      <TabsTrigger value="basic"
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#4AA8F0] data-[state=active]:shadow-sm text-sm">Basic Info</TabsTrigger>
                      <TabsTrigger value="advanced"
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#4AA8F0] data-[state=active]:shadow-sm text-sm">Additional Info</TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic" className="pt-4">
                      <FormField
                        control={form.control}
                        name="hospitalAffiliation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#2E3A59] font-medium text-sm">Hospital Affiliation</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger
                                  className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59]">
                                  <SelectValue placeholder={hospitals.length === 0 ? "Loading..." : "Select hospital"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {hospitals.map((hospital) => (
                                  <SelectItem key={hospital} value={hospital}>{hospital}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs text-red-500" />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="advanced" className="pt-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="education"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#2E3A59] font-medium text-sm">Education</FormLabel>
                            <FormControl>
                              <Input placeholder="Tribhuvan University Institute of Medicine" {...field}
                                className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59] placeholder:text-[#A0B4CC] focus-visible:ring-[#4AA8F0] focus-visible:border-[#4AA8F0] transition-all" />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="licenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#2E3A59] font-medium text-sm">License Number</FormLabel>
                            <FormControl>
                              <Input placeholder="NMC-12345" {...field}
                                className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59] placeholder:text-[#A0B4CC] focus-visible:ring-[#4AA8F0] focus-visible:border-[#4AA8F0] transition-all" />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="about"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#2E3A59] font-medium text-sm">About</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell patients about your practice, experience, and approach to care"
                                {...field}
                                className="rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59] placeholder:text-[#A0B4CC] focus-visible:ring-[#4AA8F0] focus-visible:border-[#4AA8F0] transition-all" />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[#4AA8F0] hover:bg-[#3B98E0] text-white font-semibold shadow-md shadow-[#4AA8F0]/25 hover:shadow-lg hover:shadow-[#4AA8F0]/30 transition-all disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#5D6F88]">
              Already have an account?{" "}
              <Link href="/login" className="text-[#4AA8F0] hover:text-[#3B98E0] font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-[#D6EAF8]">
            <p className="text-xs text-center text-[#A0B4CC]">
              Secure healthcare platform for Nepal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

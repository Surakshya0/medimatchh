import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, User, Phone, Droplets, MapPin, Building, Globe, Hash, Save, ArrowLeft, Calendar } from "lucide-react";

interface PatientProfile {
  id: number;
  userId: number;
  gender: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  bloodType: string | null;
  dateOfBirth: string | null;
  profilePicture: string | null;
}

export default function PatientSettings() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: patientData, isLoading: isLoadingPatient } = useQuery<PatientProfile>({
    queryKey: ["/api/patient-profile"],
    queryFn: async () => {
      const res = await fetch("/api/patient-profile", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch patient profile");
      return res.json();
    },
    enabled: !!isAuthenticated && user?.userType === "patient",
    retry: 1
  });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    bloodType: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.text()) || "Failed to update name");
      return res.json();
    },
    onError: (err: Error) => {
      toast({ title: "Name update failed", description: err.message, variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      dateOfBirth: string;
      gender: string;
      phone: string;
      bloodType: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
    }) => {
      const res = await fetch("/api/patient-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.text()) || "Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated", description: "Your changes have been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/patient-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patientData) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      const res = await fetch(`/api/patient/${patientData.id}/image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      queryClient.invalidateQueries({ queryKey: ["/api/patient-profile"] });
      toast({ title: "Photo updated", description: "Profile picture has been changed." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (patientData) {
      const dob = patientData.dateOfBirth
        ? new Date(patientData.dateOfBirth).toISOString().split("T")[0]
        : "";
      setForm({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        dateOfBirth: dob,
        gender: patientData.gender ?? "",
        phone: patientData.phone ?? "",
        bloodType: patientData.bloodType ?? "",
        address: patientData.address ?? "",
        city: patientData.city ?? "",
        state: patientData.state ?? "",
        zipCode: patientData.zipCode ?? "",
      });
    }
  }, [patientData, user]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
    else if (!isLoading && isAuthenticated && user?.userType !== "patient") setLocation("/doctor/dashboard");
  }, [isAuthenticated, isLoading, user, setLocation]);

  const handleSave = async () => {
    await updateUserMutation.mutateAsync({
      firstName: form.firstName,
      lastName: form.lastName,
    });
    const { firstName, lastName, ...profileFields } = form;
    updateProfileMutation.mutate(profileFields);
  };

  const setField = (field: keyof typeof form) => (value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  if (isLoading || isLoadingPatient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
        <div className="max-w-5xl mx-auto px-6 py-8 pt-24 animate-pulse space-y-6">
          <div className="h-32 bg-sky-200 rounded-3xl" />
          <div className="h-64 bg-sky-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.userType !== "patient") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-6 py-8 pt-24 space-y-8">

        <div className="relative overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-white rounded-3xl">
          <div className="absolute -top-8 -right-8 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative px-6 py-10 flex items-center gap-6">
            <div className="relative group">
              {patientData?.profilePicture ? (
                <img
                  src={patientData.profilePicture}
                  alt="Profile"
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5 text-sky-500" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium mb-1">Patient Panel</p>
                  <h1 className="text-3xl md:text-4xl font-bold">Patient Settings</h1>
                  <p className="text-white/75 mt-1 text-sm">
                    Update your personal information
                  </p>
                </div>
                <Link href="/patient/dashboard">
                  <div className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-sky-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center">
                    <User className="h-4 w-4 text-sky-500" />
                  </div>
                  <h2 className="font-bold text-[#2E3A59] text-lg">Personal Information</h2>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending || updateUserMutation.isPending}
                  className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm hover:from-sky-500 hover:to-blue-600"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {updateProfileMutation.isPending || updateUserMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                      <User className="h-3 w-3 inline mr-1" />
                      First Name
                    </label>
                    <Input
                      value={form.firstName}
                      onChange={e => setField("firstName")(e.target.value)}
                      placeholder="First name"
                      className="rounded-xl border-sky-100 focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                      <User className="h-3 w-3 inline mr-1" />
                      Last Name
                    </label>
                    <Input
                      value={form.lastName}
                      onChange={e => setField("lastName")(e.target.value)}
                      placeholder="Last name"
                      className="rounded-xl border-sky-100 focus:border-sky-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Date of Birth
                    </label>
                    <Input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={e => setField("dateOfBirth")(e.target.value)}
                      className="rounded-xl border-sky-100 focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                      <User className="h-3 w-3 inline mr-1" />
                      Gender
                    </label>
                    <Select onValueChange={setField("gender")} value={form.gender || undefined}>
                      <SelectTrigger className="rounded-xl border-sky-100 focus:border-sky-400">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                      <Phone className="h-3 w-3 inline mr-1" />
                      Phone Number
                    </label>
                    <Input
                      value={form.phone}
                      onChange={e => setField("phone")(e.target.value)}
                      placeholder="Enter phone number"
                      className="rounded-xl border-sky-100 focus:border-sky-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                    <Droplets className="h-3 w-3 inline mr-1" />
                    Blood Type
                  </label>
                  <Select onValueChange={setField("bloodType")} value={form.bloodType || undefined}>
                    <SelectTrigger className="rounded-xl border-sky-100 focus:border-sky-400">
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
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
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-bold text-[#2E3A59] mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-sky-400" />
                    Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        Street Address
                      </label>
                      <Input
                        value={form.address}
                        onChange={e => setField("address")(e.target.value)}
                        placeholder="Enter street address"
                        className="rounded-xl border-sky-100 focus:border-sky-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                        <Building className="h-3 w-3 inline mr-1" />
                        City
                      </label>
                      <Input
                        value={form.city}
                        onChange={e => setField("city")(e.target.value)}
                        placeholder="Enter city"
                        className="rounded-xl border-sky-100 focus:border-sky-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                        <Globe className="h-3 w-3 inline mr-1" />
                        Province
                      </label>
                      <Input
                        value={form.state}
                        onChange={e => setField("state")(e.target.value)}
                        placeholder="Enter province"
                        className="rounded-xl border-sky-100 focus:border-sky-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                        <Hash className="h-3 w-3 inline mr-1" />
                        Postal Code
                      </label>
                      <Input
                        value={form.zipCode}
                        onChange={e => setField("zipCode")(e.target.value)}
                        placeholder="Enter postal code"
                        className="rounded-xl border-sky-100 focus:border-sky-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-sky-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center">
                    <User className="h-4 w-4 text-sky-500" />
                  </div>
                  <h2 className="font-bold text-[#2E3A59]">Profile Status</h2>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Account</span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Profile</span>
                  <span className={`flex items-center gap-1 text-sm font-semibold ${patientData?.phone ? "text-emerald-600" : "text-amber-600"}`}>
                    <span className={`w-2 h-2 rounded-full ${patientData?.phone ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {patientData?.phone ? "Complete" : "Incomplete"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm text-gray-600">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

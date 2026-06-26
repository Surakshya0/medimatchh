import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save, User, Mail, Briefcase, GraduationCap, Stethoscope, Building, FileText, Hash } from "lucide-react";

interface DoctorProfile {
  id: number;
  userId: number;
  specialty: string;
  experience: number;
  hospitalAffiliation: string | null;
  education: string | null;
  licenseNumber: string | null;
  about: string | null;
  profilePicture: string | null;
  acceptingNewPatients: boolean | null;
  rating: number | null;
  reviewCount: number | null;
}

export default function DoctorProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery<DoctorProfile>({
    queryKey: ["/api/doctor-profile"],
    enabled: !!user && user.userType === "doctor",
  });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    specialty: "",
    experience: "",
    hospitalAffiliation: "",
    education: "",
    licenseNumber: "",
    about: "",
  });

  const [uploading, setUploading] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/doctor-profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setIsEditing(false);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const startEditing = () => {
    setForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      specialty: profile?.specialty || "",
      experience: profile?.experience?.toString() || "",
      hospitalAffiliation: profile?.hospitalAffiliation || "",
      education: profile?.education || "",
      licenseNumber: profile?.licenseNumber || "",
      about: profile?.about || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;

    await updateUserMutation.mutateAsync({
      firstName: form.firstName,
      lastName: form.lastName,
    });

    await updateProfileMutation.mutateAsync({
      specialty: form.specialty,
      experience: parseInt(form.experience) || 0,
      hospitalAffiliation: form.hospitalAffiliation || null,
      education: form.education || null,
      licenseNumber: form.licenseNumber || null,
      about: form.about || null,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      const res = await fetch(`/api/doctor/${profile.id}/image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Photo updated", description: "Profile picture has been changed." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">
        <div className="max-w-5xl mx-auto px-6 py-8 pt-24 animate-pulse space-y-6">
          <div className="h-32 bg-sky-200 rounded-3xl" />
          <div className="h-64 bg-sky-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto px-6 py-8 pt-24 space-y-8">

        <div className="relative overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-white rounded-3xl">
          <div className="absolute -top-8 -right-8 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative px-6 py-10 flex items-center gap-6">
            <div className="relative group">
              {profile?.profilePicture ? (
                <img
                  src={profile.profilePicture}
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
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">Doctor Panel</p>
              <h1 className="text-3xl md:text-4xl font-bold">Doctor Profile</h1>
              <p className="text-white/75 mt-1 text-sm">
                {isEditing ? "Edit your professional information" : "View and manage your professional profile"}
              </p>
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
                  <h2 className="font-bold text-[#2E3A59] text-lg">Profile Information</h2>
                </div>
                {!isEditing ? (
                  <Button
                    onClick={startEditing}
                    className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm hover:from-sky-500 hover:to-blue-600"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="rounded-xl border-sky-100 text-gray-500"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending || updateUserMutation.isPending}
                      className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm hover:from-sky-500 hover:to-blue-600"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-5">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                          First Name
                        </label>
                        <Input
                          value={form.firstName}
                          onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                          className="rounded-xl border-sky-100 focus:border-sky-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                          Last Name
                        </label>
                        <Input
                          value={form.lastName}
                          onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                          className="rounded-xl border-sky-100 focus:border-sky-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                        <Stethoscope className="h-3 w-3 inline mr-1" />
                        Specialty
                      </label>
                      <Input
                        value={form.specialty}
                        onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                        className="rounded-xl border-sky-100 focus:border-sky-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                          <Briefcase className="h-3 w-3 inline mr-1" />
                          Experience (years)
                        </label>
                        <Input
                          type="number"
                          value={form.experience}
                          onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                          className="rounded-xl border-sky-100 focus:border-sky-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                          <Building className="h-3 w-3 inline mr-1" />
                          Hospital Affiliation
                        </label>
                        <Input
                          value={form.hospitalAffiliation}
                          onChange={e => setForm(f => ({ ...f, hospitalAffiliation: e.target.value }))}
                          className="rounded-xl border-sky-100 focus:border-sky-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                          <GraduationCap className="h-3 w-3 inline mr-1" />
                          Education
                        </label>
                        <Input
                          value={form.education}
                          onChange={e => setForm(f => ({ ...f, education: e.target.value }))}
                          className="rounded-xl border-sky-100 focus:border-sky-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                          <Hash className="h-3 w-3 inline mr-1" />
                          License Number
                        </label>
                        <Input
                          value={form.licenseNumber}
                          onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))}
                          className="rounded-xl border-sky-100 focus:border-sky-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                        <FileText className="h-3 w-3 inline mr-1" />
                        About
                      </label>
                      <Textarea
                        value={form.about}
                        onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
                        className="rounded-xl border-sky-100 focus:border-sky-400 min-h-[100px]"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                        <User className="h-3 w-3 inline mr-1" />
                        Name
                      </p>
                      <p className="text-lg font-bold text-[#2E3A59]">Dr. {user?.firstName} {user?.lastName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                        <Mail className="h-3 w-3 inline mr-1" />
                        Email
                      </p>
                      <p className="text-base text-[#2E3A59]">{user?.email}</p>
                    </div>
                    {profile && (
                      <>
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                            <Stethoscope className="h-3 w-3 inline mr-1" />
                            Specialty
                          </p>
                          <p className="text-base text-[#2E3A59]">{profile.specialty}</p>
                        </div>
                        {profile.experience && (
                          <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                              <Briefcase className="h-3 w-3 inline mr-1" />
                              Experience
                            </p>
                            <p className="text-base text-[#2E3A59]">{profile.experience} years</p>
                          </div>
                        )}
                        {profile.hospitalAffiliation && (
                          <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                              <Building className="h-3 w-3 inline mr-1" />
                              Hospital Affiliation
                            </p>
                            <p className="text-base text-[#2E3A59]">{profile.hospitalAffiliation}</p>
                          </div>
                        )}
                        {profile.education && (
                          <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                              <GraduationCap className="h-3 w-3 inline mr-1" />
                              Education
                            </p>
                            <p className="text-base text-[#2E3A59]">{profile.education}</p>
                          </div>
                        )}
                        {profile.licenseNumber && (
                          <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                              <Hash className="h-3 w-3 inline mr-1" />
                              License Number
                            </p>
                            <p className="text-base text-[#2E3A59]">{profile.licenseNumber}</p>
                          </div>
                        )}
                        {profile.about && (
                          <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                              <FileText className="h-3 w-3 inline mr-1" />
                              About
                            </p>
                            <p className="text-base text-[#2E3A59]">{profile.about}</p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
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
                  <span className="text-sm text-gray-500">Verification</span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />Verified
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">License</span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />Active
                  </span>
                </div>
                {profile?.acceptingNewPatients !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Accepting Patients</span>
                    <span className={`flex items-center gap-1 text-sm font-semibold ${profile?.acceptingNewPatients ? "text-emerald-600" : "text-amber-600"}`}>
                      <span className={`w-2 h-2 rounded-full ${profile?.acceptingNewPatients ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {profile?.acceptingNewPatients ? "Yes" : "No"}
                    </span>
                  </div>
                )}
                {profile?.rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Rating</span>
                    <span className="text-sm font-semibold text-amber-500">
                      ★ {profile.rating} ({profile.reviewCount || 0})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

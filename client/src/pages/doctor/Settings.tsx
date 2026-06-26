import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save, User, Stethoscope, Briefcase, Building, GraduationCap, Hash, FileText, Shield, Key, LogOut, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function DoctorSettings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("profile");

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/doctor-profile"],
    enabled: !!user && user.userType === "doctor",
  });

  const [form, setForm] = useState({
    firstName: "", lastName: "", specialty: "", experience: "",
    hospitalAffiliation: "", education: "", licenseNumber: "", about: "",
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm(f => ({
        firstName: user?.firstName || f.firstName,
        lastName: user?.lastName || f.lastName,
        specialty: profile.specialty || f.specialty,
        experience: profile.experience?.toString() || f.experience,
        hospitalAffiliation: profile.hospitalAffiliation || f.hospitalAffiliation,
        education: profile.education || f.education,
        licenseNumber: profile.licenseNumber || f.licenseNumber,
        about: profile.about || f.about,
      }));
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("PATCH", "/api/doctor-profile", data); return r.json(); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    },
    onError: (err: Error) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("PATCH", "/api/user", data); return r.json(); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/me"] }),
    onError: (err: Error) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
  });

  const saveProfile = async () => {
    await updateUserMutation.mutateAsync({ firstName: form.firstName, lastName: form.lastName });
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
      const fd = new FormData();
      fd.append("profileImage", file);
      const res = await fetch(`/api/doctor/${profile.id}/image`, { method: "POST", credentials: "include", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Photo updated", description: "Profile picture has been changed." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto px-6 py-8 pt-24 space-y-8">

        <div className="relative overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-white rounded-3xl">
          <div className="absolute -top-8 -right-8 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative px-6 py-10">
            <Link href="/doctor/dashboard" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium mb-3 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <p className="text-white/70 text-sm font-medium mb-1">Doctor Panel</p>
            <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>
            <p className="text-white/75 mt-1 text-sm">Manage your profile and preferences</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-sky-100 rounded-2xl p-1">
            <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-sky-50 data-[state=active]:text-sky-600">
              <User className="h-4 w-4 mr-1.5" />Profile
            </TabsTrigger>

            <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-sky-50 data-[state=active]:text-sky-600">
              <Shield className="h-4 w-4 mr-1.5" />Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-sky-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center">
                    <User className="h-4 w-4 text-sky-500" />
                  </div>
                  <h2 className="font-bold text-[#2E3A59] text-lg">Profile Information</h2>
                </div>
                <Button
                  onClick={saveProfile}
                  disabled={updateProfileMutation.isPending || updateUserMutation.isPending}
                  className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm hover:from-sky-500 hover:to-blue-600"
                >
                  <Save className="h-4 w-4 mr-1" />Save
                </Button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-5 mb-6 pb-6 border-b border-sky-50">
                  <div className="relative group">
                    {profile?.profilePicture ? (
                      <img src={profile.profilePicture} alt="Profile" className="w-20 h-20 rounded-2xl object-cover ring-2 ring-sky-200" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-200 to-blue-200 flex items-center justify-center text-3xl font-bold text-sky-700">
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
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#2E3A59]">Dr. {user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">{profile?.specialty}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">First Name</label>
                    <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="rounded-xl border-sky-100 focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">Last Name</label>
                    <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="rounded-xl border-sky-100 focus:border-sky-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block"><Stethoscope className="h-3 w-3 inline mr-1" />Specialty</label>
                    <Input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} className="rounded-xl border-sky-100 focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block"><Briefcase className="h-3 w-3 inline mr-1" />Experience (years)</label>
                    <Input type="number" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} className="rounded-xl border-sky-100 focus:border-sky-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block"><Building className="h-3 w-3 inline mr-1" />Hospital Affiliation</label>
                    <Input value={form.hospitalAffiliation} onChange={e => setForm(f => ({ ...f, hospitalAffiliation: e.target.value }))} className="rounded-xl border-sky-100 focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block"><GraduationCap className="h-3 w-3 inline mr-1" />Education</label>
                    <Input value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} className="rounded-xl border-sky-100 focus:border-sky-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block"><Hash className="h-3 w-3 inline mr-1" />License Number</label>
                    <Input value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} className="rounded-xl border-sky-100 focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">Accepting New Patients</label>
                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        checked={profile?.acceptingNewPatients ?? true}
                        onCheckedChange={v => updateProfileMutation.mutate({ acceptingNewPatients: v })}
                      />
                      <span className="text-sm text-gray-500">{profile?.acceptingNewPatients ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block"><FileText className="h-3 w-3 inline mr-1" />About</label>
                  <Textarea value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))} className="rounded-xl border-sky-100 focus:border-sky-400 min-h-[80px]" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-sky-50">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-sky-500" />
                  <h2 className="font-bold text-[#2E3A59] text-lg">Account Security</h2>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <Button variant="outline" className="w-full justify-start rounded-xl border-sky-100 text-sky-600 hover:bg-sky-50">
                  <Key className="h-4 w-4 mr-2" />Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-xl border-sky-100 text-sky-600 hover:bg-sky-50">
                  <Shield className="h-4 w-4 mr-2" />Two-Factor Authentication
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-xl border-red-100 text-red-500 hover:bg-red-50" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />Logout from all devices
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-sky-50">
                <h2 className="font-bold text-[#2E3A59]">Account Info</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm font-semibold text-[#2E3A59] break-all">{user?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Account Type</p>
                  <p className="text-sm font-semibold text-[#2E3A59]">Doctor</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

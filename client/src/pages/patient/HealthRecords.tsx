import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FlaskRound, Zap, Activity, Stethoscope, Pill, Plus, Shield, FilePlus2, ArrowLeft } from "lucide-react";

interface HealthRecord {
  id: number;
  patientId: number;
  recordType: string;
  name: string;
  details?: string;
  date: string;
  isActive: boolean;
}

const healthRecordSchema = z.object({
  recordType: z.string().min(1, { message: "Record type is required" }),
  name: z.string().min(1, { message: "Name is required" }),
  details: z.string().optional(),
  date: z.string().min(1, { message: "Date is required" }).refine(val => !isNaN(new Date(val).getTime()), { message: "Invalid date format." }),
  isActive: z.boolean().default(true),
});

type HealthRecordFormValues = z.infer<typeof healthRecordSchema>;

const recordConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  medication: { icon: <Pill className="h-5 w-5" />, color: "bg-blue-50 text-blue-500" },
  allergy: { icon: <Zap className="h-5 w-5" />, color: "bg-orange-50 text-orange-500" },
  condition: { icon: <Activity className="h-5 w-5" />, color: "bg-red-50 text-red-500" },
  vaccination: { icon: <Shield className="h-5 w-5" />, color: "bg-emerald-50 text-emerald-500" },
  test: { icon: <FlaskRound className="h-5 w-5" />, color: "bg-purple-50 text-purple-500" },
  checkup: { icon: <Stethoscope className="h-5 w-5" />, color: "bg-sky-50 text-sky-500" },
};

export default function HealthRecords() {
  const { isAuthenticated, user, profile, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);

  const { data: healthRecords = [], isLoading: isLoadingRecords } = useQuery<HealthRecord[]>({
    queryKey: ["/api/health-records"],
    enabled: !!isAuthenticated && user?.userType === "patient",
  });

  const form = useForm<HealthRecordFormValues>({
    resolver: zodResolver(healthRecordSchema),
    defaultValues: { recordType: "", name: "", details: "", date: new Date().toISOString().split('T')[0], isActive: true },
  });

  const addHealthRecordMutation = useMutation({
    mutationFn: async (data: HealthRecordFormValues) => {
      const res = await apiRequest("POST", "/api/health-records", { ...data, patientId: profile?.id });
      if (!res.ok) throw new Error("Failed to create health record");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Health record added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/health-records"] });
      setIsAddRecordOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ title: "Failed to add health record", description: error.message || "Please try again later", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
    else if (!isLoading && isAuthenticated && user?.userType !== "patient") setLocation("/doctor/dashboard");
  }, [isAuthenticated, isLoading, user, setLocation]);

  const filteredRecords = activeTab === "all" ? healthRecords : healthRecords.filter(r => r.recordType === activeTab);
  const onSubmit = (data: HealthRecordFormValues) => addHealthRecordMutation.mutate(data);

  if (isLoading || isLoadingRecords) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
        <div className="max-w-5xl mx-auto px-6 py-8 pt-24 animate-pulse space-y-6">
          <div className="h-32 bg-sky-100 rounded-3xl" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-sky-100 rounded-3xl" />)}
          </div>
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
              <h1 className="text-3xl md:text-4xl font-bold">Health Records</h1>
              <p className="text-white/75 mt-1 text-sm">{healthRecords.length} records on file</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/patient/dashboard">
                <div className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </div>
              </Link>
              <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-sky-500 hover:bg-sky-50 rounded-xl shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />Add Record
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Health Record</DialogTitle>
                  <DialogDescription>Add a new health record to your medical history.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="recordType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Record Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select record type" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="medication">Medication</SelectItem>
                            <SelectItem value="allergy">Allergy</SelectItem>
                            <SelectItem value="condition">Medical Condition</SelectItem>
                            <SelectItem value="vaccination">Vaccination</SelectItem>
                            <SelectItem value="test">Lab Test</SelectItem>
                            <SelectItem value="checkup">Checkup</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl><Input className="rounded-xl" placeholder="e.g., Lisinopril, Peanut Allergy, etc." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="details" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Details (Optional)</FormLabel>
                        <FormControl><Input className="rounded-xl" placeholder="Additional details" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl><Input type="date" className="rounded-xl" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <Button type="submit" disabled={addHealthRecordMutation.isPending}
                        className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white">
                        {addHealthRecordMutation.isPending ? "Adding..." : "Add Record"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden p-1">
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 md:grid-cols-7 bg-sky-50/50 rounded-2xl p-1">
              <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">All</TabsTrigger>
              <TabsTrigger value="medication" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Medications</TabsTrigger>
              <TabsTrigger value="allergy" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Allergies</TabsTrigger>
              <TabsTrigger value="condition" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Conditions</TabsTrigger>
              <TabsTrigger value="vaccination" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Vaccinations</TabsTrigger>
              <TabsTrigger value="test" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Lab Tests</TabsTrigger>
              <TabsTrigger value="checkup" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Checkups</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Records grid */}
        {filteredRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.map((record: HealthRecord) => {
              const config = recordConfig[record.recordType] ?? { icon: <FilePlus2 className="h-5 w-5" />, color: "bg-neutral-50 text-neutral-500" };
              return (
                <div key={record.id} className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${config.color}`}>
                        {config.icon}
                      </div>
                      {!record.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <h3 className="font-bold text-[#2E3A59] text-sm mb-1">{record.name}</h3>
                    <p className="text-xs text-gray-400 capitalize mb-1">{record.recordType}</p>
                    {record.details && <p className="text-xs text-gray-500 mb-2">{record.details}</p>}
                    <p className="text-xs text-gray-400 mt-3">Added: {new Date(record.date).toLocaleDateString()}</p>
                  </div>
                  <div className="px-5 py-3 bg-sky-50/30 border-t border-sky-50">
                    <Button variant="outline" size="sm" className="w-full text-xs rounded-xl border-sky-100 text-sky-600 hover:bg-sky-50">
                      Edit Record
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-sky-50 text-sky-400 mb-4"><FilePlus2 className="h-8 w-8" /></div>
            <h3 className="text-lg font-bold text-[#2E3A59] mb-2">No health records found</h3>
            <p className="text-gray-400 text-sm mb-6">
              {activeTab === "all" ? "You don't have any health records yet." : `You don't have any ${activeTab} records.`}
            </p>
            <Button onClick={() => setIsAddRecordOpen(true)}
              className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm">
              <Plus className="h-4 w-4 mr-2" />Add Health Record
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

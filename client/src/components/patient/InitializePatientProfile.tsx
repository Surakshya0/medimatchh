import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function InitializePatientProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);

  // Create mutation to initialize the patient profile
  const initializeProfileMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/patient-profile");
      return await res.json();
    },
    onSuccess: (data) => {
      setInitialized(true);
      console.log("Patient profile created successfully:", data);
    },
    onError: (error: Error) => {
      console.error("Error creating patient profile:", error);
      toast({
        title: "Error creating patient profile",
        description: "Please try reloading the page or contact support.",
        variant: "destructive",
      });
    }
  });

  // When the component mounts, check if we need to initialize a profile
  useEffect(() => {
    // Only run this for patient users who are logged in
    if (user && user.userType === "patient" && !initialized && !initializeProfileMutation.isPending) {
      console.log("Attempting to initialize patient profile for user:", user.id);
      initializeProfileMutation.mutate();
    }
  }, [user, initialized, initializeProfileMutation]);

  // If the initialization is in progress, show a loading indicator
  if (initializeProfileMutation.isPending) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h3 className="text-lg font-medium mt-4">Initializing your patient profile...</h3>
          <p className="text-sm text-neutral-500 mt-2">This will only take a moment.</p>
        </div>
      </div>
    );
  }

  // No UI needed once initialized
  return null;
}
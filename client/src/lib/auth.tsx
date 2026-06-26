import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: "patient" | "doctor" | "admin";
}

interface Profile {
  id: number;
  userId: number;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any, profileData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Fetch current user data
  const { isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 401) {
            setUser(null);
            setProfile(null);
            return null;
          }
          throw new Error(`Failed to fetch user: ${res.statusText}`);
        }
        const data = await res.json();
        setUser(data.user || null);
        setProfile(data.profile || null);
        return data;
      } catch (err) {
        console.error("Error fetching user:", err);
        return null;
      }
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      setUser(data.user || null);
      setProfile(data.profile || null);
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      
      // Redirect based on user type
      if (data.user) {
        if (data.user.userType === "patient") {
          setLocation("/patient/dashboard");
        } else if (data.user.userType === "doctor") {
          setLocation("/doctor/dashboard");
        } else if (data.user.userType === "admin") {
          setLocation("/admin/dashboard");
        }
      }
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { userData: any; profileData: any }) => {
      // Send userData with profile object containing profileData
      const payload = {
        ...data.userData,
        profile: data.profileData
      };
      const res = await apiRequest("POST", "/api/register", payload);
      return await res.json();
    },
    onSuccess: (data) => {
      setUser(data.user || null);
      setProfile(data.profile || null);
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: "Registration successful",
        description: "Your account has been created.",
      });
    },
    onError: (error: Error) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout", {});
    },
    onSuccess: () => {
      setUser(null);
      setProfile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setLocation("/login");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redirect users based on authentication and user type
  useEffect(() => {
    if (user && !isUserLoading) {
      if (location === "/login" || location === "/register") {
        // Redirect authenticated users from login/register pages
        if (user.userType === "patient") {
          setLocation("/patient/dashboard");
        } else if (user.userType === "doctor") {
          setLocation("/doctor/dashboard");
        } else if (user.userType === "admin") {
          setLocation("/admin/dashboard");
        }
      }
    }
  }, [user, isUserLoading, location, setLocation]);

  // Handle API functions
  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (userData: any, profileData: any) => {
    await registerMutation.mutateAsync({ userData, profileData });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const contextValue: AuthContextType = {
    user,
    profile,
    isLoading: isUserLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
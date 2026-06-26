import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Stethoscope, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message.includes("401") ? "Invalid email or password. Please try again." : message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EBF5FB] via-[#D6EAF8] to-[#BBDEFB] p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg shadow-[#4AA8F0]/20 mb-5">
            <Stethoscope className="w-8 h-8 text-[#4AA8F0]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#2E3A59]">Welcome Back</h1>
          <p className="text-[#5D6F88] mt-2 text-sm">
            Sign in to access your healthcare portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-[#4AA8F0]/10 border border-[#D6EAF8] p-8">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2E3A59] font-medium text-sm">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your@email.com"
                        type="email"
                        className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59] placeholder:text-[#A0B4CC] focus-visible:ring-[#4AA8F0] focus-visible:border-[#4AA8F0] transition-all"
                        {...field}
                      />
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
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          className="h-11 rounded-xl border-[#D6EAF8] bg-[#F8FAFE] text-[#2E3A59] placeholder:text-[#A0B4CC] focus-visible:ring-[#4AA8F0] focus-visible:border-[#4AA8F0] transition-all pr-10"
                          {...field}
                        />
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[#4AA8F0] hover:bg-[#3B98E0] text-white font-semibold shadow-md shadow-[#4AA8F0]/25 hover:shadow-lg hover:shadow-[#4AA8F0]/30 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#5D6F88]">
              Don't have an account?{" "}
              <Link href="/register" className="text-[#4AA8F0] hover:text-[#3B98E0] font-semibold transition-colors">
                Create one
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

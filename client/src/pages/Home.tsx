import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Shield,
  Heart,
  Stethoscope,
  Users,
  Video,
  ArrowRight
} from "lucide-react";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  // If user is already logged in, redirect to their dashboard
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.userType === "patient") {
        setLocation("/patient/dashboard");
      } else if (user?.userType === "doctor") {
        setLocation("/doctor/dashboard");
      }
    }
  }, [isAuthenticated, user, setLocation]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar transparent />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="pt-28 pb-20 relative overflow-hidden">
          {/* Background with gradient and pattern overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#4AA8F0] via-[#68B9F5] to-[#A3E4C1] opacity-90"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDRjMCAyLjIwOSAxLjc5MSA0IDQgNHM0LTEuNzkxIDQtNHptMC0zMGMwLTIuMjA5LTEuNzkxLTQtNC00cy00IDEuNzkxLTQgNGMwIDIuMjA5IDEuNzkxIDQgNCA0czQtMS43OTEgNC00em0wIDYwYzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0YzAgMi4yMDkgMS43OTEgNCA0IDRzNC0xLjc5MSA0LTR6bS0zMC0zMGMwLTIuMjA5LTEuNzkxLTQtNC00cy00IDEuNzkxLTQgNGMwIDIuMjA5IDEuNzkxIDQgNCA0czQtMS43OTEgNC00em02MCAwYzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0YzAgMi4yMDkgMS43OTEgNCA0IDRzNC0xLjc5MSA0LTR6bS0zNiAzMGMwLTIuMjA5LTEuNzkxLTQtNC00cy00IDEuNzkxLTQgNGMwIDIuMjA5IDEuNzkxIDQgNCA0czQtMS43OTEgNC00em02MCAwYzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0YzAgMi4yMDkgMS43OTEgNCA0IDRzNC0xLjc5MSA0LTR6bS0zNi0zMGMwLTIuMjA5LTEuNzkxLTQtNC00cy00IDEuNzkxLTQgNGMwIDIuMjA5IDEuNzkxIDQgNCA0czQtMS43OTEgNC00em02MCAwYzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0YzAgMi4yMDkgMS43OTEgNCA0IDRzNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              {/* Left column - Text content */}
              <div className="lg:w-1/2 text-white mb-10 lg:mb-0">
                <div className="bg-black/20 p-6 rounded-lg backdrop-blur-sm border border-white/20 shadow-xl inline-block mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
                  <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">AI-Powered Symptom Checker</span> for Your Health Needs
                </h1>
                <p className="text-xl mb-8 text-white/90 max-w-xl">
                  Describe your symptoms and our AI matches you with the right specialist in Nepal. 
                  Book appointments online or consult from home through telemedicine in minutes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-white text-[#4AA8F0] font-semibold hover:bg-blue-50 shadow-lg transition-all hover:translate-y-[-2px] flex items-center gap-2"
                    onClick={() => setLocation("/register")}
                  >
                    Create an Account <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white border-2 bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-[#4AA8F0] font-semibold transition-all hover:translate-y-[-2px]"
                    onClick={() => setLocation("/login")}
                  >
                    Login
                  </Button>
                </div>
              </div>
              
              {/* Right column - Stats & illustration */}
              <div className="lg:w-1/2 flex justify-center">
                <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 shadow-2xl max-w-md">
                  <div className="flex justify-between mb-8">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-[#4AA8F0]/20 text-white mb-2">
                        <Stethoscope className="h-6 w-6" />
                      </div>
                      <p className="text-white font-bold text-2xl">25+</p>
                      <p className="text-white/80 text-sm">Specialists</p>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-[#A3E4C1]/20 text-white mb-2">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="text-white font-bold text-2xl">1000+</p>
                      <p className="text-white/80 text-sm">Happy Patients</p>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-blue-400/20 text-white mb-2">
                        <Activity className="h-6 w-6" />
                      </div>
                      <p className="text-white font-bold text-2xl">200+</p>
                      <p className="text-white/80 text-sm">Symptoms</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-white/20 rounded-lg mb-4">
                    <div className="flex items-center">
                      <div className="bg-[#4AA8F0] h-8 w-8 rounded-full flex items-center justify-center mr-4">
                        <CheckCircle className="h-5 w-5 text-white" /> 
                      </div>
                      <p className="text-white">Smart symptom-to-doctor matching</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-white/20 rounded-lg mb-4">
                    <div className="flex items-center">
                      <div className="bg-[#A3E4C1] h-8 w-8 rounded-full flex items-center justify-center mr-4">
                        <CheckCircle className="h-5 w-5 text-white" /> 
                      </div>
                      <p className="text-white">Online appointment scheduling</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-white/20 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-blue-400 h-8 w-8 rounded-full flex items-center justify-center mr-4">
                        <CheckCircle className="h-5 w-5 text-white" /> 
                      </div>
                      <p className="text-white">Specialized for Nepal's healthcare</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-[#F4F7FA] relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMjUiPjxwYXRoIGQ9Ik0zNiAzNGMwLTIuMjA5LTEuNzkxLTQtNC00cy00IDEuNzkxLTQgNGMwIDIuMjA5IDEuNzkxIDQgNCA0czQtMS43OTEgNC00em0wLTMwYzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0YzAgMi4yMDkgMS43OTEgNCA0IDRzNC0xLjc5MSA0LTR6bTAgNjBjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDRjMCAyLjIwOSAxLjc5MSA0IDQgNHM0LTEuNzkxIDQtNHptLTMwLTMwYzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0YzAgMi4yMDkgMS43OTEgNCA0IDRzNC0xLjc5MSA0LTR6bTYwIDBjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDRjMCAyLjIwOSAxLjc5MSA0IDQgNHM0LTEuNzkxIDQtNHptLTM2IDMwYzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0YzAgMi4yMDkgMS43OTEgNCA0IDRzNC0xLjc5MSA0LTR6bTYwIDBjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDRjMCAyLjIwOSAxLjc5MSA0IDQgNHM0LTEuNzkxIDQtNHptLTM2LTMwYzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0YzAgMi4yMDkgMS43OTEgNCA0IDRzNC0xLjc5MSA0LTR6bTYwIDBjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDRjMCAyLjIwOSAxLjc5MSA0IDQgNHM0LTEuNzkxIDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-[#4AA8F0] to-[#A3E4C1] text-white mb-6 shadow-lg">
                <Activity className="h-8 w-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2E3A59] mb-4">How MediMatch Works</h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Describe your symptoms and get matched with the right specialist instantly. Our AI-powered system makes healthcare simple and accessible.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:translate-y-[-5px] group">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-[#E8F6FD] to-[#4AA8F0]/20 text-[#4AA8F0] mb-6 group-hover:bg-[#4AA8F0] group-hover:text-white transition-all">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#2E3A59]">1. Describe Your Symptoms</h3>
                <p className="text-neutral-600">Select from our comprehensive list of 200+ symptoms to help us understand your health concerns.</p>
                <div className="h-1 w-16 bg-[#4AA8F0] rounded-full mt-5"></div>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:translate-y-[-5px] group md:translate-y-4">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-[#E3F8EC] to-[#A3E4C1]/20 text-[#A3E4C1] mb-6 group-hover:bg-[#A3E4C1] group-hover:text-white transition-all">
                  <Stethoscope className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#2E3A59]">2. Get AI-Matched</h3>
                <p className="text-neutral-600">Our AI algorithm matches you with specialists who treat your specific symptoms.</p>
                <div className="h-1 w-16 bg-[#A3E4C1] rounded-full mt-5"></div>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:translate-y-[-5px] group">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-[#E8F6FD] to-[#4AA8F0]/20 text-[#4AA8F0] mb-6 group-hover:bg-[#4AA8F0] group-hover:text-white transition-all">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#2E3A59]">3. Book Your Appointment</h3>
                <p className="text-neutral-600">Choose a convenient time and book your appointment online in just a few clicks.</p>
                <div className="h-1 w-16 bg-[#4AA8F0] rounded-full mt-5"></div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Symptom Checker Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-[#E8F6FD] to-[#D4EDF9] p-10 md:p-14 rounded-3xl shadow-xl">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="md:w-3/5">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-[#4AA8F0] text-white mb-5 shadow-lg">
                      <Activity className="h-7 w-7" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#2E3A59] mb-4">
                      Try Our AI Symptom Checker
                    </h2>
                    <p className="text-neutral-700 text-lg mb-6">
                      Not sure which specialist you need? Use our intelligent symptom checker to describe what you're feeling, and our AI will recommend the right doctor for you. It's fast, accurate, and tailored for Nepal's healthcare system.
                    </p>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center text-neutral-700">
                        <div className="bg-[#4AA8F0] h-6 w-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <CheckCircle className="h-3.5 w-3.5 text-white" />
                        </div>
                        Describe symptoms in plain language
                      </li>
                      <li className="flex items-center text-neutral-700">
                        <div className="bg-[#4AA8F0] h-6 w-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <CheckCircle className="h-3.5 w-3.5 text-white" />
                        </div>
                        Get matched to the right specialist instantly
                      </li>
                      <li className="flex items-center text-neutral-700">
                        <div className="bg-[#4AA8F0] h-6 w-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <CheckCircle className="h-3.5 w-3.5 text-white" />
                        </div>
                        Book an appointment right after matching
                      </li>
                    </ul>
                    <Button
                      size="lg"
                      className="bg-[#4AA8F0] text-white font-semibold hover:bg-[#4AA8F0]/90 shadow-lg transition-all hover:translate-y-[-2px]"
                      onClick={() => setLocation("/register")}
                    >
                      Try Symptom Checker <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="md:w-2/5 flex justify-center">
                    <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/60 shadow-lg text-center">
                      <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-[#4AA8F0] to-[#A3E4C1] text-white mb-4">
                        <Activity className="h-10 w-10" />
                      </div>
                      <p className="text-[#2E3A59] font-bold text-lg">135+ Symptoms</p>
                      <p className="text-neutral-500">comprehensive database</p>
                      <div className="mt-4 pt-4 border-t border-white/40">
                        <p className="text-[#2E3A59] font-semibold">Powered by AI</p>
                        <p className="text-neutral-500 text-sm">Smart matching algorithm</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-[#4AA8F0] to-[#A3E4C1] text-white mb-6 shadow-lg">
                <Heart className="h-8 w-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2E3A59] mb-4">Why Choose MediMatch</h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Our platform offers a range of features designed to make healthcare more accessible and convenient for everyone in Nepal.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:translate-y-[-3px] border-t-4 border-[#4AA8F0]">
                <div className="bg-[#E8F6FD] p-3 rounded-lg inline-block mb-4">
                  <Clock className="h-8 w-8 text-[#4AA8F0]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#2E3A59]">Save Time</h3>
                <p className="text-neutral-600">Find and book appointments online without lengthy phone calls or waiting periods.</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:translate-y-[-3px] border-t-4 border-[#4AA8F0]">
                <div className="bg-[#E8F6FD] p-3 rounded-lg inline-block mb-4">
                  <Video className="h-8 w-8 text-[#4AA8F0]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#2E3A59]">Telemedicine</h3>
                <p className="text-neutral-600">Consult with specialists from home through secure video appointments. No travel needed.</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:translate-y-[-3px] border-t-4 border-[#4AA8F0]">
                <div className="bg-[#E8F6FD] p-3 rounded-lg inline-block mb-4">
                  <CheckCircle className="h-8 w-8 text-[#4AA8F0]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#2E3A59]">Qualified Specialists</h3>
                <p className="text-neutral-600">All doctors on our platform are verified healthcare professionals from Nepal.</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:translate-y-[-3px] border-t-4 border-[#4AA8F0]">
                <div className="bg-[#E8F6FD] p-3 rounded-lg inline-block mb-4">
                  <Shield className="h-8 w-8 text-[#4AA8F0]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#2E3A59]">Secure & Private</h3>
                <p className="text-neutral-600">Your health information and personal data are kept secure and confidential.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Doctor CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white p-10 rounded-2xl shadow-xl border border-neutral-100">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-[#2E3A59] mb-2">Are you a doctor?</h2>
                  <p className="text-neutral-600 text-lg">Join MediMatch and reach more patients in Nepal through our smart matching platform.</p>
                </div>
                <Button
                  size="lg"
                  className="bg-[#4AA8F0] text-white font-semibold hover:bg-[#4AA8F0]/90 shadow-lg transition-all hover:translate-y-[-2px] flex items-center gap-2 flex-shrink-0"
                  onClick={() => setLocation("/register")}
                >
                  Register as Doctor <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative overflow-hidden">
          {/* Background with gradient and pattern overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#4AA8F0] via-[#68B9F5] to-[#A3E4C1]"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDRjMCAyLjIwOSAxLjc5MSA0IDQgNHM0LTEuNzkxIDQtNHptMC0zMGMwLTIuMjA5LTEuNzkxLTQtNC00cy00IDEuNzkxLTQgNGMwIDIuMjA5IDEuNzkxIDQgNCA0czQtMS43OTEgNC00em0wIDYwYzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0YzAgMi4yMDkgMS43OTEgNCA0IDRzNC0xLjc5MSA0LTR6bS0zMC0zMGMwLTIuMjA5LTEuNzkxLTQtNC00cy00IDEuNzkxLTQgNGMwIDIuMjA5IDEuNzkxIDQgNCA0czQtMS43OTEgNC00em02MCAwYzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0YzAgMi4yMDkgMS43OTEgNCA0IDRzNC0xLjc5MSA0LTR6bS0zNiAzMGMwLTIuMjA5LTEuNzkxLTQtNC00cy00IDEuNzkxLTQgNGMwIDIuMjA5IDEuNzkxIDQgNCA0czQtMS43OTEgNC00em02MCAwYzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0YzAgMi4yMDkgMS43OTEgNCA0IDRzNC0xLjc5MSA0LTR6bS0zNi0zMGMwLTIuMjA5LTEuNzkxLTQtNC00cy00IDEuNzkxLTQgNGMwIDIuMjA5IDEuNzkxIDQgNCA0czQtMS43OTEgNC00em02MCAwYzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0YzAgMi4yMDkgMS43OTEgNCA0IDRzNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-sm p-12 rounded-3xl border border-white/20 shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Check Your Symptoms?</h2>
                <div className="flex flex-wrap justify-center gap-8 mb-6">
                  <div className="flex items-center text-white">
                    <div className="bg-white/20 rounded-full p-2 mr-3">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <span>200+ Symptoms</span>
                  </div>
                  <div className="flex items-center text-white">
                    <div className="bg-white/20 rounded-full p-2 mr-3">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <span>25+ Specialists</span>
                  </div>
                  <div className="flex items-center text-white">
                    <div className="bg-white/20 rounded-full p-2 mr-3">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <span>Smart Matching</span>
                  </div>
                </div>
                <p className="text-xl text-white max-w-2xl mx-auto">
                  Join thousands of patients who have found the right healthcare provider through MediMatch in Nepal.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-5">
                <Button 
                  size="lg" 
                  className="bg-white text-[#4AA8F0] font-semibold hover:bg-blue-50 shadow-lg transition-all hover:translate-y-[-2px] flex items-center gap-2 text-lg"
                  onClick={() => setLocation("/register")}
                >
                  Get Started Today <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

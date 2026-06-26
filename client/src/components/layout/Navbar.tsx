import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  ChevronDown, 
  Menu, 
  User, 
  LogOut, 
  Settings, 
  Calendar, 
  FileText
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavbarProps {
  transparent?: boolean;
}

export default function Navbar({ transparent = false }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const getInitials = () => {
    if (!user) return "?";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  const getNavLinks = () => {
    if (!isAuthenticated) {
      return [
        { name: "Home", href: "/" },
      ];
    }

    if (user?.userType === "patient") {
      return [
        { name: "AI Checker", href: "/patient/ai-checker" },
        { name: "Appointments", href: "/patient/appointments" },
        { name: "Health Records", href: "/patient/health-records" },
      ];
    }

    if (user?.userType === "admin") {
      return [
        { name: "Dashboard", href: "/admin/dashboard" },
      ];
    }

    return [
      { name: "Dashboard", href: "/doctor/dashboard" },
      { name: "Schedule", href: "/doctor/schedule" },
      { name: "Patients", href: "/doctor/patients" },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className={`${transparent ? "bg-transparent" : "bg-white shadow-md"} fixed w-full z-10`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-[#2A6F97]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <Link href="/" className="ml-2 text-[#2A6F97] font-bold text-lg">MediMatch</Link>
              </div>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-4 items-center">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href} className={`${transparent ? 'text-accent font-semibold' : 'text-neutral-800'} hover:text-[#2A6F97] px-3 py-2 rounded-md text-sm font-medium`}>
                  {link.name}
                </Link>
              ))}
              {!isAuthenticated && (
                <button onClick={() => {
                    if (location !== "/") {
                      setLocation("/");
                      setTimeout(() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }), 100);
                  } else {
                    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                  }
                }} className={`${transparent ? 'text-accent font-semibold' : 'text-neutral-800'} hover:text-[#2A6F97] px-3 py-2 rounded-md text-sm font-medium bg-transparent border-none cursor-pointer`}>
                  How It Works
                </button>
              )}
            </nav>
          </div>
          
          {/* Right side with account */}
          <div className="flex items-center">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col gap-4 mt-6">
                  <Link href="/" className="flex items-center mb-6" onClick={() => setIsSheetOpen(false)}>
                    <svg className="h-8 w-8 text-[#2A6F97]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span className="ml-2 text-[#2A6F97] font-bold text-lg">MediMatch</span>
                  </Link>
                  {navLinks.map((link) => (
                    <Link 
                      key={link.name} 
                      href={link.href} 
                      className="text-neutral-800 hover:text-[#2A6F97] py-2 text-base font-medium"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                  {!isAuthenticated && (
                    <button onClick={() => {
                      setIsSheetOpen(false);
                      if (location !== "/") {
                        setLocation("/");
                        setTimeout(() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }), 100);
                      } else {
                        document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                      }
                    }} className="text-neutral-800 hover:text-[#2A6F97] py-2 text-base font-medium bg-transparent border-none cursor-pointer text-left">
                      How It Works
                    </button>
                  )}
                  {isAuthenticated ? (
                    <>
                      <div className="h-px bg-neutral-200 my-2" />
                      {user?.userType === "patient" && (
                        <>
                          <Link 
                            href="/patient/dashboard"
                            className="flex items-center text-neutral-800 hover:text-[#2A6F97] py-2 text-base font-medium"
                            onClick={() => setIsSheetOpen(false)}
                          >
                            <User className="h-5 w-5 mr-2" />
                            Dashboard
                          </Link>
                          <Link 
                            href="/patient/appointments"
                            className="flex items-center text-neutral-800 hover:text-[#2A6F97] py-2 text-base font-medium"
                            onClick={() => setIsSheetOpen(false)}
                          >
                            <Calendar className="h-5 w-5 mr-2" />
                            Appointments
                          </Link>
                          <Link 
                            href="/patient/health-records"
                            className="flex items-center text-neutral-800 hover:text-[#2A6F97] py-2 text-base font-medium"
                            onClick={() => setIsSheetOpen(false)}
                          >
                            <FileText className="h-5 w-5 mr-2" />
                            Health Records
                          </Link>
                          <Link 
                            href="/patient/ai-checker"
                            className="flex items-center text-neutral-800 hover:text-[#2A6F97] py-2 text-base font-medium"
                            onClick={() => setIsSheetOpen(false)}
                          >
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.03 3.03 0 01-.722 2.562L12 21l-2.169-2.562a3.03 3.03 0 01-.722-2.562l-.347-.347z"/>
                            </svg>
                            AI Checker
                          </Link>
                        </>
                      )}
                      <button
                        className="flex items-center text-red-600 hover:text-red-700 py-2 text-base font-medium"
                        onClick={() => {
                          logout();
                          setIsSheetOpen(false);
                        }}
                      >
                        <LogOut className="h-5 w-5 mr-2" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="h-px bg-neutral-200 my-2" />
                      <Link 
                        href="/login"
                        className="text-[#2A6F97] hover:text-[#1d5474] py-2 text-base font-medium"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        Log In
                      </Link>
                      <Link 
                        href="/register"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        <Button className="w-full bg-[#2A6F97] hover:bg-[#1d5474]">Sign Up</Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden md:ml-4 md:flex md:items-center">
              {isAuthenticated ? (
                <>
                  <div className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-[#d9edf5] text-[#2A6F97] flex items-center justify-center text-sm font-medium">
                            {getInitials()}
                          </div>
                          <span className="ml-1 text-sm font-medium text-neutral-800">
                            {user?.firstName} {user?.lastName}
                          </span>
                          <ChevronDown className="h-4 w-4 text-neutral-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {user?.userType === "patient" && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href="/patient/dashboard" className="flex items-center cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/patient/appointments" className="flex items-center cursor-pointer">
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>Appointments</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/patient/health-records" className="flex items-center cursor-pointer">
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Health Records</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/patient/settings" className="flex items-center cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        {user?.userType === "doctor" && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href="/doctor/dashboard" className="flex items-center cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/doctor/schedule" className="flex items-center cursor-pointer">
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>Schedule</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/doctor/patients" className="flex items-center cursor-pointer">
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Patients</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/doctor/settings" className="flex items-center cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        {user?.userType === "admin" && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href="/admin/dashboard" className="flex items-center cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Logout</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className={`${transparent ? 'text-accent font-semibold' : 'text-neutral-800'} hover:text-[#2A6F97] px-3 py-2 rounded-md text-sm font-medium`}>
                    Log In
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className={`ml-2 ${transparent ? 'bg-accent text-black font-semibold hover:bg-accent/90' : 'bg-[#2A6F97] hover:bg-[#1d5474]'}`}>Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

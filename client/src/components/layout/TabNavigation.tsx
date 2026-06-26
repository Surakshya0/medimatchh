import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

interface TabNavigationProps {
  activeTab: string;
}

export default function TabNavigation({ activeTab }: TabNavigationProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path || activeTab === path;

  const getTabs = () => {
    if (user?.userType === "patient") {
      return [
        { name: "Dashboard", href: "/patient/dashboard" },
        { name: "Settings", href: "/patient/settings" },
      ];
    } else if (user?.userType === "doctor") {
      return [
        { name: "Dashboard", href: "/doctor/dashboard" },
        { name: "Settings", href: "/doctor/settings" },
      ];
    }
    return [];
  };

  const tabs = getTabs();

  return (
    <div className="border-b border-sky-100 bg-white/80 backdrop-blur-sm fixed w-full z-10 top-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <Link key={tab.name} to={tab.href}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive(tab.href)
                  ? "border-sky-400 text-sky-500"
                  : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
              }`}>
              {tab.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

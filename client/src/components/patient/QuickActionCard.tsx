import { Link } from "wouter";
import { Search, Calendar, FileText, User, Clipboard, MessageCircle, Bell, Heart, Settings, LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  buttonVariant: "primary" | "outline";
  linkTo: string;
}

export default function QuickActionCard({ icon, title, description, buttonText, buttonVariant, linkTo }: QuickActionCardProps) {
  const getIcon = (): JSX.Element => {
    const props = { className: "h-5 w-5 text-sky-400" };
    switch (icon) {
      case "search": return <Search {...props} />;
      case "calendar": return <Calendar {...props} />;
      case "file": return <FileText {...props} />;
      case "user": return <User {...props} />;
      case "clipboard": return <Clipboard {...props} />;
      case "message": return <MessageCircle {...props} />;
      case "bell": return <Bell {...props} />;
      case "heart": return <Heart {...props} />;
      case "settings": return <Settings {...props} />;
      default: return <Search {...props} />;
    }
  };

  const isPrimary = buttonVariant === "primary";

  return (
    <div className={`${isPrimary ? "bg-gradient-to-br from-sky-400 to-blue-500 text-white" : "bg-white border border-sky-100"} rounded-3xl p-5 shadow-sm flex flex-col`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${isPrimary ? "bg-white/20" : "bg-sky-50"} rounded-2xl flex items-center justify-center`}>
          {isPrimary ? (
            <Search className="h-5 w-5" />
          ) : (
            getIcon()
          )}
        </div>
        <h3 className={`font-bold text-sm ${isPrimary ? "text-white" : "text-[#2E3A59]"}`}>{title}</h3>
      </div>
      <p className={`text-xs mb-4 ${isPrimary ? "text-white/80" : "text-gray-400"}`}>{description}</p>
      <Link href={linkTo} className={`mt-auto text-xs font-bold py-2.5 px-4 rounded-xl self-start transition-all ${
        isPrimary
          ? "bg-white text-sky-500 hover:bg-sky-50"
          : "border border-sky-100 text-sky-500 hover:bg-sky-50"
      }`}>
        {buttonText}
      </Link>
    </div>
  );
}

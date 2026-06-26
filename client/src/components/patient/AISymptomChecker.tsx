import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Moon, Thermometer, Snowflake, Droplets, TrendingDown, Activity, Frown, UtensilsCrossed,
  Wind, Speech, Brain, AlertTriangle, XCircle, Stethoscope, Heart,
  AlertCircle, Flame, Footprints, Bone, ArrowLeft, Dumbbell, User, Circle, Hand, Bandage,
  Sparkles, Pill, Eye, MessageSquare, Target, Timer, RefreshCw, Search,
  FlaskConical, Info
} from "lucide-react";

// ── Symptom icon lookup ────────────────────────────────────────────────────
const SYMPTOM_ICONS: Record<string, React.ReactNode> = {
  fatigue:          <Moon className="w-6 h-6" />,
  "high fever":     <Thermometer className="w-6 h-6" />,
  "mild fever":     <Thermometer className="w-6 h-6" />,
  chills:           <Snowflake className="w-6 h-6" />,
  sweating:         <Droplets className="w-6 h-6" />,
  "weight loss":    <TrendingDown className="w-6 h-6" />,
  malaise:          <Activity className="w-6 h-6" />,
  "loss of appetite": <UtensilsCrossed className="w-6 h-6" />,
  cough:            <Activity className="w-6 h-6" />,
  breathlessness:   <Wind className="w-6 h-6" />,
  phlegm:           <Droplets className="w-6 h-6" />,
  "runny nose":     <Wind className="w-6 h-6" />,
  congestion:       <Wind className="w-6 h-6" />,
  "throat irritation": <Speech className="w-6 h-6" />,
  "sinus pressure": <Brain className="w-6 h-6" />,
  "blood in sputum": <Droplets className="w-6 h-6" />,
  nausea:           <XCircle className="w-6 h-6" />,
  vomiting:         <AlertTriangle className="w-6 h-6" />,
  "abdominal pain": <Stethoscope className="w-6 h-6" />,
  diarrhoea:        <XCircle className="w-6 h-6" />,
  constipation:     <AlertCircle className="w-6 h-6" />,
  indigestion:      <AlertCircle className="w-6 h-6" />,
  "stomach pain":   <Stethoscope className="w-6 h-6" />,
  acidity:          <Flame className="w-6 h-6" />,
  "chest pain":     <Heart className="w-6 h-6" />,
  "fast heart rate": <Activity className="w-6 h-6" />,
  palpitations:     <Heart className="w-6 h-6" />,
  "swollen legs":   <Footprints className="w-6 h-6" />,
  "joint pain":     <Bone className="w-6 h-6" />,
  "back pain":      <ArrowLeft className="w-6 h-6" />,
  "muscle pain":    <Dumbbell className="w-6 h-6" />,
  "neck pain":      <User className="w-6 h-6" />,
  "knee pain":      <Footprints className="w-6 h-6" />,
  "stiff neck":     <AlertCircle className="w-6 h-6" />,
  "muscle weakness": <Dumbbell className="w-6 h-6" />,
  "swelling joints": <Circle className="w-6 h-6" />,
  itching:          <Hand className="w-6 h-6" />,
  "skin rash":      <Bandage className="w-6 h-6" />,
  "yellowish skin": <Circle className="w-6 h-6" />,
  "red spots over body": <Circle className="w-6 h-6" />,
  "skin peeling":   <Sparkles className="w-6 h-6" />,
  blister:          <Pill className="w-6 h-6" />,
  "pus filled pimples": <AlertCircle className="w-6 h-6" />,
  blackheads:       <Circle className="w-6 h-6" />,
  headache:         <Brain className="w-6 h-6" />,
  dizziness:        <RefreshCw className="w-6 h-6" />,
  "loss of balance": <RefreshCw className="w-6 h-6" />,
  "blurred and distorted vision": <Eye className="w-6 h-6" />,
  "slurred speech": <MessageSquare className="w-6 h-6" />,
  "spinning movements": <RefreshCw className="w-6 h-6" />,
  "weakness of one body side": <User className="w-6 h-6" />,
  "lack of concentration": <Target className="w-6 h-6" />,
  "dark urine":     <Droplets className="w-6 h-6" />,
  "burning micturition": <Flame className="w-6 h-6" />,
  "bladder discomfort": <AlertCircle className="w-6 h-6" />,
  polyuria:         <Timer className="w-6 h-6" />,
  "foul smell of urine": <AlertTriangle className="w-6 h-6" />,
  "extra marital contacts": <AlertTriangle className="w-6 h-6" />,
  "family history": <User className="w-6 h-6" />,
  obesity:          <Activity className="w-6 h-6" />,
  "weight gain":    <TrendingDown className="w-6 h-6" />,
  "excessive hunger": <UtensilsCrossed className="w-6 h-6" />,
  "increased appetite": <UtensilsCrossed className="w-6 h-6" />,
  depression:       <Frown className="w-6 h-6" />,
  anxiety:          <Brain className="w-6 h-6" />,
  irritability:     <AlertCircle className="w-6 h-6" />,
  restlessness:     <Activity className="w-6 h-6" />,
};

function SymptomIcon({ id }: { id: string }) {
  return <>{SYMPTOM_ICONS[id] ?? <Circle className="w-6 h-6" />}</>;
}

// ── Category symptom grid ─────────────────────────────────────────────────────
const SYMPTOM_GROUPS: Record<string, { symptoms: { id: string; label: string }[] }> = {
  General:     { symptoms: [
    { id: "fatigue",          label: "Fatigue" },
    { id: "high fever",       label: "High Fever" },
    { id: "mild fever",       label: "Mild Fever" },
    { id: "chills",           label: "Chills" },
    { id: "sweating",         label: "Sweating" },
    { id: "weight loss",      label: "Weight Loss" },
    { id: "malaise",          label: "Malaise" },
    { id: "loss of appetite", label: "Loss of Appetite" },
  ]},
  Respiratory: { symptoms: [
    { id: "cough",            label: "Cough" },
    { id: "breathlessness",   label: "Breathlessness" },
    { id: "phlegm",           label: "Phlegm" },
    { id: "runny nose",       label: "Runny Nose" },
    { id: "congestion",       label: "Congestion" },
    { id: "throat irritation",label: "Sore Throat" },
    { id: "sinus pressure",   label: "Sinus Pressure" },
    { id: "blood in sputum",  label: "Blood in Sputum" },
  ]},
  Digestive:   { symptoms: [
    { id: "nausea",           label: "Nausea" },
    { id: "vomiting",         label: "Vomiting" },
    { id: "abdominal pain",   label: "Abdominal Pain" },
    { id: "diarrhoea",        label: "Diarrhoea" },
    { id: "constipation",     label: "Constipation" },
    { id: "indigestion",      label: "Indigestion" },
    { id: "stomach pain",     label: "Stomach Pain" },
    { id: "acidity",          label: "Acidity" },
  ]},
  Cardiac:     { symptoms: [
    { id: "chest pain",       label: "Chest Pain" },
    { id: "fast heart rate",  label: "Fast Heart Rate" },
    { id: "palpitations",     label: "Palpitations" },
    { id: "swollen legs",     label: "Swollen Legs" },
  ]},
  Musculo:     { symptoms: [
    { id: "joint pain",       label: "Joint Pain" },
    { id: "back pain",        label: "Back Pain" },
    { id: "muscle pain",      label: "Muscle Pain" },
    { id: "neck pain",        label: "Neck Pain" },
    { id: "knee pain",        label: "Knee Pain" },
    { id: "stiff neck",       label: "Stiff Neck" },
    { id: "muscle weakness",  label: "Muscle Weakness" },
    { id: "swelling joints",  label: "Swelling Joints" },
  ]},
  Skin:        { symptoms: [
    { id: "itching",          label: "Itching" },
    { id: "skin rash",        label: "Skin Rash" },
    { id: "yellowish skin",   label: "Yellowish Skin" },
    { id: "red spots over body", label: "Red Spots" },
    { id: "skin peeling",     label: "Skin Peeling" },
    { id: "blister",          label: "Blister" },
    { id: "pus filled pimples",label: "Pimples" },
    { id: "blackheads",       label: "Blackheads" },
  ]},
  Neuro:       { symptoms: [
    { id: "headache",         label: "Headache" },
    { id: "dizziness",        label: "Dizziness" },
    { id: "loss of balance",  label: "Loss of Balance" },
    { id: "blurred and distorted vision", label: "Blurred Vision" },
    { id: "slurred speech",   label: "Slurred Speech" },
    { id: "spinning movements",label: "Spinning" },
    { id: "weakness of one body side", label: "One-Side Weakness" },
    { id: "lack of concentration", label: "Poor Focus" },
  ]},
  Urological:  { symptoms: [
    { id: "dark urine",       label: "Dark Urine" },
    { id: "burning micturition", label: "Burning Urination" },
    { id: "bladder discomfort",label: "Bladder Discomfort" },
    { id: "polyuria",         label: "Frequent Urination" },
    { id: "foul smell of urine", label: "Foul Urine Smell" },
  ]},
};

const GROUP_STYLES: Record<string, { tab: string; card: string; badge: string }> = {
  General:    { tab: "bg-violet-400 text-white",     card: "border-violet-200 from-violet-50 to-purple-50",     badge: "bg-violet-100 text-violet-700 border-violet-200" },
  Respiratory:{ tab: "bg-sky-400 text-white",      card: "border-sky-200 from-sky-50 to-blue-50",       badge: "bg-sky-100 text-sky-700 border-sky-200" },
  Digestive:  { tab: "bg-orange-400 text-white",   card: "border-orange-200 from-orange-50 to-amber-50",badge: "bg-orange-100 text-orange-700 border-orange-200" },
  Cardiac:    { tab: "bg-red-400 text-white",      card: "border-red-200 from-red-50 to-orange-50",       badge: "bg-red-100 text-red-700 border-red-200" },
  Musculo:    { tab: "bg-purple-400 text-white",   card: "border-purple-200 from-purple-50 to-indigo-50",badge: "bg-purple-100 text-purple-700 border-purple-200" },
  Skin:       { tab: "bg-amber-400 text-white",    card: "border-amber-200 from-amber-50 to-yellow-50", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  Neuro:      { tab: "bg-indigo-400 text-white",   card: "border-indigo-200 from-indigo-50 to-violet-50",badge: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  Urological: { tab: "bg-teal-400 text-white",     card: "border-teal-200 from-teal-50 to-cyan-50",     badge: "bg-teal-100 text-teal-700 border-teal-200" },
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface TopCandidate { disease: string; probability: number; }
interface Prediction   { disease: string; confidence: number; topCandidates: TopCandidate[]; }
interface DoctorResult {
  id: number; firstName: string; lastName: string;
  specialty: string; experience: number; hospitalAffiliation: string;
  rating: number | null; reviewCount: number;
  profilePicture: string | null; matchScore: number;
  symptomMatches: number; acceptingNewPatients: boolean;
}
interface AIResponse {
  prediction: Prediction; resolvedSpecialty: string; doctors: DoctorResult[];
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number | null }) {
  const r = rating ?? 0;
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => i + 1).map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= r ? "text-sky-400" : "text-sky-100"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  );
}

// ── Confidence bar ─────────────────────────────────────────────────────────────
function ConfidenceBar({ value, label, color = "bg-sky-400" }: { value: number; label: string; color?: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="font-medium truncate max-w-[72%] capitalize">{label}</span>
        <span className="font-bold text-sky-600">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2.5 bg-sky-50 rounded-full overflow-hidden border border-sky-100">
        <div className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${Math.max(value * 100, 2)}%` }}/>
      </div>
    </div>
  );
}

// ── Autocomplete search ───────────────────────────────────────────────────────
function SymptomSearchBar({ selected, onAdd, allSymptoms }: { selected: string[]; onAdd: (s: string) => void; allSymptoms: string[] }) {
  const [query, setQuery]      = useState("");
  const [open, setOpen]        = useState(false);
  const [highlighted, setHigh] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);

  const suggestions = query.trim().length < 1
    ? []
    : allSymptoms
        .filter(s => s.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s))
        .slice(0, 8);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!dropRef.current?.contains(e.target as Node) &&
          !inputRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function addSymptom(s: string) {
    onAdd(s); setQuery(""); setHigh(0); setOpen(false);
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHigh(h => Math.min(h+1, suggestions.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHigh(h => Math.max(h-1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); if (suggestions[highlighted]) addSymptom(suggestions[highlighted]); }
    if (e.key === "Escape")    { setOpen(false); }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-sky-200
        bg-sky-50/40 focus-within:border-sky-400 focus-within:bg-white transition-all">
        <svg className="w-5 h-5 text-sky-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setHigh(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder='Type to search symptoms… e.g. "fever", "itching", "chest pain"'
          className="flex-1 bg-transparent outline-none text-[#2E3A59] placeholder-sky-200 text-sm"
        />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="text-sky-300 hover:text-sky-500 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown suggestions */}
      {open && query.trim().length > 0 && (
        <div ref={dropRef}
          className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
          {suggestions.length > 0 ? (
            <>
              <div className="px-4 py-2 bg-sky-50 border-b border-sky-100">
                <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  {suggestions.length} symptom{suggestions.length !== 1 ? "s" : ""} found — click or press Enter to add
                </p>
              </div>
              {suggestions.map((s, i) => (
                <button key={s}
                  onMouseDown={e => { e.preventDefault(); addSymptom(s); }}
                  onMouseEnter={() => setHigh(i)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors
                    ${i === highlighted ? "bg-sky-50" : "hover:bg-sky-50/50"}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${i === highlighted ? "bg-sky-400" : "bg-sky-200"}`}/>
                  <span className="text-sm text-[#2E3A59] capitalize flex-1">
                    {/* Highlight matching part */}
                    {s.toLowerCase().includes(query.toLowerCase()) ? (
                      <>
                        {s.substring(0, s.toLowerCase().indexOf(query.toLowerCase()))}
                        <strong className="text-sky-500">
                          {s.substring(s.toLowerCase().indexOf(query.toLowerCase()), s.toLowerCase().indexOf(query.toLowerCase()) + query.length)}
                        </strong>
                        {s.substring(s.toLowerCase().indexOf(query.toLowerCase()) + query.length)}
                      </>
                    ) : s}
                  </span>
                  <span className="text-xs text-sky-300 flex-shrink-0">add +</span>
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-4 text-center text-sm text-gray-400">
              No matching symptoms — try a different word
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AISymptomChecker() {
  const [selected, setSelected]       = useState<string[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>("General");
  const [result, setResult]           = useState<AIResponse | null>(null);

  // Fetch symptoms from API
  const { data: apiSymptoms = [] } = useQuery<{ id: number; name: string; bodyPart: string }[]>({
    queryKey: ["/api/symptoms"],
    staleTime: 5 * 60 * 1000,
  });
  const allSymptoms: string[] = apiSymptoms.length > 0
    ? apiSymptoms.map(s => s.name)
    : [];

  const addSymptom    = (s: string) => { if (!selected.includes(s)) { setSelected(p => [...p, s]); setResult(null); } };
  const removeSymptom = (s: string) => { setSelected(p => p.filter(x => x !== s)); setResult(null); };
  const toggleSymptom = (s: string) => selected.includes(s) ? removeSymptom(s) : addSymptom(s);

  const mutation = useMutation({
    mutationFn: async ({ symptomNames }: { symptomNames: string[] }) => {
      const res = await fetch("/api/ai-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ symptomNames }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<AIResponse>;
    },
    onSuccess: data => {
      setResult(data);
      setTimeout(() => document.getElementById("ai-results")?.scrollIntoView({ behavior: "smooth" }), 100);
    },
  });

  const currentGroup = SYMPTOM_GROUPS[activeGroup];
  const gs = GROUP_STYLES[activeGroup];

  const confidenceLevel = (c: number) =>
    c >= 0.5  ? { label: "High confidence",     badge: "bg-emerald-100 text-emerald-700 border-emerald-200" }
    : c >= 0.25 ? { label: "Moderate confidence", badge: "bg-amber-100 text-amber-700 border-amber-200" }
    :             { label: "Low confidence",      badge: "bg-orange-100 text-orange-700 border-orange-200" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-white">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"/>
        <div className="absolute -bottom-8 -left-8 w-56 h-56 bg-white/10 rounded-full blur-2xl"/>
        <div className="relative max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"/>
            AI-Powered · 41 Diseases · 132 Symptoms · 4,920 Records
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">Smart Symptom Checker</h1>
          <p className="text-white/85 text-lg max-w-xl mx-auto">
            Search or select your symptoms. Our AI predicts your condition and finds the right specialist.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        {/* ── Main selector card ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-sky-100 overflow-hidden">

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-sky-50">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#2E3A59]">Select your symptoms</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Search by typing <span className="text-sky-400 font-medium">or</span> pick from categories below
                </p>
              </div>
              {selected.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="bg-sky-100 text-sky-600 text-sm font-bold px-3 py-1.5 rounded-full">
                    {selected.length} selected
                  </span>
                  <button onClick={() => { setSelected([]); setResult(null); }}
                    className="text-xs text-gray-400 hover:text-sky-500 px-2 py-1 rounded-full
                      border border-dashed border-gray-200 hover:border-sky-300 transition-colors">
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-5">

            {/* ── Search bar ── */}
            <div>
              <SymptomSearchBar selected={selected} onAdd={addSymptom} allSymptoms={allSymptoms}/>
            </div>

            {/* ── Selected tags ── */}
            {selected.length > 0 && (
              <div className="p-3 bg-sky-50/50 rounded-2xl border border-sky-100">
                <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">
                  Added symptoms
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.map(s => (
                    <span key={s}
                      className="inline-flex items-center gap-1.5 bg-white text-sky-700 text-sm
                        font-medium px-3 py-1.5 rounded-full border border-sky-200 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"/>
                      <span className="capitalize">{s}</span>
                      <button onClick={() => removeSymptom(s)}
                        className="ml-0.5 text-sky-300 hover:text-sky-500 font-bold text-base leading-none">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Divider ── */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-sky-100"/>
              <span className="text-xs text-sky-300 font-semibold uppercase tracking-widest">
                or browse by category
              </span>
              <div className="flex-1 h-px bg-sky-100"/>
            </div>

            {/* ── Category tabs ── */}
            <div className="flex gap-2 flex-wrap">
              {Object.keys(SYMPTOM_GROUPS).map(g => (
                <button key={g} onClick={() => setActiveGroup(g)}
                  className={`text-xs font-bold px-3.5 py-2 rounded-full border transition-all duration-150
                    ${activeGroup === g
                      ? GROUP_STYLES[g].tab + " shadow-sm"
                      : "bg-white text-gray-500 border-gray-200 hover:border-sky-200 hover:text-sky-500"
                    }`}>
                  {g}
                  {/* Count selected in this group */}
                  {SYMPTOM_GROUPS[g].symptoms.filter(s => selected.includes(s.id)).length > 0 && (
                    <span className="ml-1.5 bg-white/30 text-white text-[10px] px-1 rounded-full">
                      {SYMPTOM_GROUPS[g].symptoms.filter(s => selected.includes(s.id)).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Symptom grid for active category ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {currentGroup.symptoms.map(({ id, label }) => {
                const active = selected.includes(id);
                return (
                  <button key={id} onClick={() => toggleSymptom(id)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2
                      transition-all duration-200 text-sm font-medium text-center cursor-pointer select-none
                      ${active
                        ? `border-sky-400 bg-gradient-to-br ${gs.card} shadow-md shadow-sky-100 scale-[1.04]`
                        : "border-gray-100 bg-white hover:border-sky-200 hover:shadow-sm"
                      }`}>
                    {active && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-sky-400 rounded-full
                        flex items-center justify-center shadow-sm">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                        </svg>
                      </span>
                    )}
                    <span className="text-sky-500"><SymptomIcon id={id} /></span>
                    <span className={active ? "text-sky-700 font-semibold" : "text-gray-600"}>{label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${gs.badge}`}>
                      {activeGroup}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── Analyse button ── */}
            <button
              onClick={() => mutation.mutate({ symptomNames: selected })}
              disabled={selected.length < 1 || mutation.isPending}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-200
                ${selected.length >= 1 && !mutation.isPending
                  ? "bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg shadow-sky-200 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                  : "bg-sky-100 text-sky-300 cursor-not-allowed"
                }`}>
              {mutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Analysing {selected.length} symptom{selected.length !== 1 ? "s" : ""}…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.03 3.03 0 01-.722 2.562L12 21l-2.169-2.562a3.03 3.03 0 01-.722-2.562l-.347-.347z"/>
                  </svg>
                  {selected.length < 1
                    ? "Add symptoms to continue"
                    : `Analyse ${selected.length} symptom${selected.length !== 1 ? "s" : ""} with AI`}
                </span>
              )}
            </button>

            {selected.length > 0 && selected.length < 3 && (
              <p className="text-center text-xs text-amber-500 -mt-2">
                <Info className="inline w-4 h-4 -mt-0.5 text-amber-500" /> Adding more symptoms improves prediction accuracy
              </p>
            )}
          </div>
        </div>

        {/* Error */}
        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm text-center">
            Something went wrong. Please try again.
          </div>
        )}

        {/* Results */}
        {result && (
          <div id="ai-results" className="space-y-5">

            {/* Prediction */}
            <div className="bg-white rounded-3xl shadow-sm border border-sky-100 overflow-hidden">
              <div className="bg-gradient-to-r from-sky-400 to-indigo-500 px-6 py-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FlaskConical className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/75 text-xs font-bold uppercase tracking-widest">
                    AI Prediction · Naive Bayes
                  </p>
                  <h3 className="text-white text-2xl font-bold truncate">{result.prediction.disease}</h3>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0
                  ${confidenceLevel(result.prediction.confidence).badge}`}>
                  {confidenceLevel(result.prediction.confidence).label}
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100 mb-5">
                  <svg className="w-5 h-5 text-sky-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                  </svg>
                  <span className="text-sm text-sky-700">
                    Recommended specialty: <strong>{result.resolvedSpecialty}</strong>
                  </span>
                </div>

                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Top predictions</p>
                {result.prediction.topCandidates.map((c, i) => (
                  <ConfidenceBar key={c.disease} label={c.disease} value={c.probability}
                    color={i === 0 ? "bg-gradient-to-r from-sky-400 to-blue-500" : i === 1 ? "bg-sky-300" : "bg-sky-200"}/>
                ))}

                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <strong>About this score:</strong> With 41 possible diseases, {Math.round(result.prediction.confidence * 100)}% means the AI is {Math.round(result.prediction.confidence / (1/41))}× more confident than a random guess. Add more symptoms to improve accuracy.
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                  <AlertTriangle className="inline w-4 h-4 -mt-0.5 text-amber-500" /> AI-assisted prediction only — not a clinical diagnosis. Always consult a qualified doctor.
                </p>
              </div>
            </div>

            {/* Doctors */}
            {result.doctors.length > 0 ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold text-[#2E3A59]">Recommended Doctors</h2>
                  <span className="bg-sky-100 text-sky-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    {result.doctors.length} found
                  </span>
                  <span className="text-xs text-gray-400">{result.resolvedSpecialty}</span>
                </div>
                <div className="space-y-4">
                  {result.doctors.map((doctor, index) => (
                    <div key={doctor.id}
                      className="bg-white rounded-3xl shadow-sm border border-sky-100 p-6 hover:shadow-md hover:border-sky-200 transition-all duration-200">
                      <div className="flex items-start gap-4">
                        <div className="relative flex-shrink-0">
                          {doctor.profilePicture ? (
                            <img src={doctor.profilePicture} alt="" className="w-16 h-16 rounded-2xl object-cover"/>
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-200 to-blue-200
                              flex items-center justify-center text-sky-600 font-bold text-xl">
                              {doctor.firstName[0]}{doctor.lastName[0]}
                            </div>
                          )}
                          {index === 0 && (
                            <span className="absolute -top-2 -right-2 bg-gradient-to-r from-sky-400 to-blue-500
                              text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                              #1
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-[#2E3A59] text-lg">Dr. {doctor.firstName} {doctor.lastName}</h3>
                              <p className="text-sky-500 text-sm font-semibold">{doctor.specialty}</p>
                              <p className="text-gray-400 text-xs mt-0.5">{doctor.hospitalAffiliation}</p>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50
                              border-2 border-sky-200 flex flex-col items-center justify-center flex-shrink-0">
                              <span className="text-sky-600 font-bold text-xl leading-none">{doctor.matchScore}</span>
                              <span className="text-sky-400 text-[9px] font-bold uppercase tracking-wide">score</span>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              {doctor.experience} yrs experience
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Stars rating={doctor.rating}/>
                              <span className="text-xs text-gray-400">({doctor.reviewCount})</span>
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {doctor.symptomMatches > 0 && (
                              <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-600 text-xs font-medium px-2.5 py-1 rounded-full border border-sky-100">
                                ✓ {doctor.symptomMatches} symptom{doctor.symptomMatches !== 1 ? "s" : ""} matched
                              </span>
                            )}
                            {doctor.acceptingNewPatients && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-100">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
                                Accepting patients
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 pt-4 border-t border-sky-50 flex gap-3">
                        <Link href={`/patient/book-appointment/${doctor.id}`} className="flex-1">
                          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500
                            text-white text-sm font-bold hover:shadow-md hover:shadow-sky-200
                            hover:scale-[1.01] active:scale-[0.99] transition-all duration-150">
                            Book Appointment
                          </button>
                        </Link>
                        <Link href="/patient/dashboard">
                          <button className="px-4 py-3 rounded-xl border-2 border-sky-100 text-sky-500
                            text-sm font-semibold hover:border-sky-300 transition-all duration-150">
                            View All
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-sky-100 p-12 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 text-sky-300" />
                </div>
                <p className="text-gray-600 font-semibold text-lg">No doctors found for {result.resolvedSpecialty}</p>
                <p className="text-gray-400 text-sm mt-2">Try different symptoms or browse all doctors.</p>
                <Link href="/patient/dashboard">
                  <button className="mt-5 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500
                    text-white text-sm font-bold hover:shadow-md transition-all">
                    Browse All Doctors
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

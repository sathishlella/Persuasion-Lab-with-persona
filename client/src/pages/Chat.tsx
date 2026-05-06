import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Brain, Send, ArrowLeft, BarChart3, CheckCircle2, XCircle,
  Loader2, Zap, Activity, ChevronRight, Shuffle,
} from "lucide-react";
import { toast } from "sonner";
import { PersonaCard, PERSONA_DEFINITIONS } from "@/components/PersonaCard";
import { SatisfactionRating } from "@/components/SatisfactionRating";
import type { PersonaType, ScenarioCode, ConsumerBrand, BudgetRange, MainNeed } from "../../../drizzle/schema";

type ModelType = "gpt" | "grok" | "gemini";

interface PersonaProfile {
  personaType: PersonaType;
  scenarioCode: ScenarioCode;
  consumerBrand: ConsumerBrand;
  budget: BudgetRange;
  mainNeed: MainNeed;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  technique?: string;
  phase?: string;
  isConversion?: boolean;
  sentimentScore?: number;
  responseTimeMs?: number;
  responseLength?: number;
}

// ─── Scenario metadata ───────────────────────────────────────────────────────

const SCENARIO_LABELS: Record<ScenarioCode, { label: string; color: string }> = {
  S1: { label: "S1 · Personalized", color: "text-violet-400 bg-violet-500/10 border-violet-500/25" },
  S2: { label: "S2 · Generic", color: "text-slate-400 bg-slate-500/10 border-slate-500/25" },
  S3: { label: "S3 · Evidence", color: "text-blue-400 bg-blue-500/10 border-blue-500/25" },
  S4: { label: "S4 · Vague", color: "text-orange-400 bg-orange-500/10 border-orange-500/25" },
  S5: { label: "S5 · High Pressure", color: "text-red-400 bg-red-500/10 border-red-500/25" },
  S6: { label: "S6 · Low Pressure", color: "text-green-400 bg-green-500/10 border-green-500/25" },
  S7: { label: "S7 · Price-Value", color: "text-amber-400 bg-amber-500/10 border-amber-500/25" },
  S8: { label: "S8 · Innovation", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25" },
};

const SCENARIO_CODES: ScenarioCode[] = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];
const CONSUMER_BRANDS: ConsumerBrand[] = ["Apple", "Samsung", "Xiaomi", "Oppo", "Vivo", "Other"];
const BUDGET_RANGES: BudgetRange[] = ["RM1000-1500", "RM1500-2500", "RM2500+"];
const MAIN_NEEDS: MainNeed[] = ["Camera", "Battery", "Gaming", "Work", "General"];

function randomScenario(): ScenarioCode {
  return SCENARIO_CODES[Math.floor(Math.random() * SCENARIO_CODES.length)];
}

// ─── Model meta ──────────────────────────────────────────────────────────────

const MODEL_META: Record<ModelType, {
  label: string; accent: string; bar: string; badge: string;
  ring: string; dot: string; msgBg: string; icon: string;
}> = {
  gemini: {
    label: "Gemini", accent: "text-purple-400",
    bar: "from-purple-600 via-violet-500 to-purple-400",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    ring: "focus:ring-purple-500/30 focus:border-purple-500/50",
    dot: "bg-purple-400", msgBg: "bg-purple-500/5 border border-purple-500/10", icon: "🪐",
  },
  grok: {
    label: "Grok", accent: "text-blue-400",
    bar: "from-blue-600 via-cyan-500 to-blue-400",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    ring: "focus:ring-blue-500/30 focus:border-blue-500/50",
    dot: "bg-blue-400", msgBg: "bg-blue-500/5 border border-blue-500/10", icon: "⚡",
  },
  gpt: {
    label: "GPT", accent: "text-emerald-400",
    bar: "from-emerald-600 via-green-500 to-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    ring: "focus:ring-emerald-500/30 focus:border-emerald-500/50",
    dot: "bg-emerald-400", msgBg: "bg-emerald-500/5 border border-emerald-500/10", icon: "🤖",
  },
};

// ─── Badges ──────────────────────────────────────────────────────────────────

const TECHNIQUE_COLORS: Record<string, string> = {
  reciprocity:   "bg-amber-500/10 text-amber-400 border-amber-500/25",
  commitment:    "bg-blue-500/10 text-blue-400 border-blue-500/25",
  social_proof:  "bg-green-500/10 text-green-400 border-green-500/25",
  authority:     "bg-purple-500/10 text-purple-400 border-purple-500/25",
  liking:        "bg-pink-500/10 text-pink-400 border-pink-500/25",
  scarcity:      "bg-red-500/10 text-red-400 border-red-500/25",
  unity:         "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
  reframing:     "bg-teal-500/10 text-teal-400 border-teal-500/25",
  anchoring:     "bg-orange-500/10 text-orange-400 border-orange-500/25",
  loss_aversion: "bg-rose-500/10 text-rose-400 border-rose-500/25",
  future_pacing: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25",
};
const PHASE_COLORS: Record<string, string> = {
  rapport:    "bg-sky-500/10 text-sky-400 border-sky-500/25",
  discovery:  "bg-violet-500/10 text-violet-400 border-violet-500/25",
  seed_doubt: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
  reframe:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  close:      "bg-rose-500/10 text-rose-400 border-rose-500/25",
};

function TechniqueBadge({ technique }: { technique: string }) {
  if (!technique || technique === "none") return null;
  const color = TECHNIQUE_COLORS[technique] ?? "bg-muted/40 text-muted-foreground border-border/50";
  return <span className={`inline-flex items-center text-[9px] px-2 py-0.5 rounded-full border font-semibold tracking-wide uppercase ${color}`}>{technique.replace(/_/g, " ")}</span>;
}
function PhaseBadge({ phase }: { phase: string }) {
  if (!phase) return null;
  const color = PHASE_COLORS[phase] ?? "bg-muted/40 text-muted-foreground border-border/50";
  return <span className={`inline-flex items-center text-[9px] px-2 py-0.5 rounded-full border font-semibold tracking-wide uppercase ${color}`}>{phase.replace(/_/g, " ")}</span>;
}

function TypingDots({ model }: { model: ModelType }) {
  const meta = MODEL_META[model];
  return (
    <div className="flex justify-start px-4 py-2">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl rounded-bl-sm ${meta.msgBg} max-w-[60%]`}>
        <div className="flex items-center gap-1">
          {[0, 150, 300].map((d) => (
            <div key={d} className={`w-1.5 h-1.5 rounded-full ${meta.dot} animate-bounce opacity-60`} style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
        <span className={`text-[11px] ${meta.accent} opacity-70`}>thinking…</span>
      </div>
    </div>
  );
}

// ─── Persona Setup Screens ───────────────────────────────────────────────────

type SetupStep = "persona" | "profile";

interface PersonaSetupProps {
  onComplete: (profile: PersonaProfile) => void;
}

function PersonaSetup({ onComplete }: PersonaSetupProps) {
  const [step, setStep] = useState<SetupStep>("persona");
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);
  const [brand, setBrand] = useState<ConsumerBrand>("Apple");
  const [budget, setBudget] = useState<BudgetRange>("RM1500-2500");
  const [mainNeed, setMainNeed] = useState<MainNeed>("Camera");
  const [scenario] = useState<ScenarioCode>(() => randomScenario());

  const handleNext = () => {
    if (!selectedPersona) { toast.error("Please select a consumer persona"); return; }
    setStep("profile");
  };

  const handleStart = () => {
    if (!selectedPersona) return;
    onComplete({ personaType: selectedPersona, scenarioCode: scenario, consumerBrand: brand, budget, mainNeed });
  };

  if (step === "persona") {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-semibold uppercase tracking-widest mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Step 1 of 2 · Persona
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Select Consumer Persona</h2>
            <p className="text-white/50 text-sm mt-1.5 leading-relaxed">
              This shapes the customer's psychology and how each AI approaches the sale.
            </p>
          </div>

          {/* Persona cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {PERSONA_DEFINITIONS.map(persona => (
              <PersonaCard
                key={persona.type}
                persona={persona}
                selected={selectedPersona === persona.type}
                onClick={() => setSelectedPersona(persona.type)}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={!selectedPersona}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Next: Consumer Profile <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Profile setup
  const personaDef = PERSONA_DEFINITIONS.find(p => p.type === selectedPersona)!;
  const scenarioMeta = SCENARIO_LABELS[scenario];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-semibold uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Step 2 of 2 · Profile
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Consumer Profile</h2>
          <p className="text-white/50 text-sm mt-1.5">Configure the customer's background details</p>
        </div>

        {/* Selected persona summary */}
        <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
          <span className="text-2xl">{personaDef.icon}</span>
          <div>
            <div className="text-white text-sm font-semibold">{personaDef.label}</div>
            <div className="text-white/50 text-xs">{personaDef.tagline}</div>
          </div>
          <button onClick={() => setStep("persona")} className="ml-auto text-xs text-white/40 hover:text-white/60 transition-colors">
            Change
          </button>
        </div>

        {/* Randomly assigned scenario badge */}
        <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-white/40 text-xs mb-1">Research Scenario (auto-assigned)</div>
            <span className={`inline-flex items-center text-xs px-3 py-1 rounded-full border font-semibold ${scenarioMeta.color}`}>
              {scenarioMeta.label}
            </span>
          </div>
          <div className="text-white/25 text-xs text-right">
            <Shuffle className="w-3.5 h-3.5 mb-0.5 inline" />
            <div>Random</div>
          </div>
        </div>

        {/* Profile fields */}
        <div className="space-y-4 mb-6">
          {/* Current Brand */}
          <div>
            <label className="text-white/60 text-xs font-medium mb-2 block">Current Preferred Brand</label>
            <div className="flex flex-wrap gap-2">
              {CONSUMER_BRANDS.map(b => (
                <button
                  key={b}
                  onClick={() => setBrand(b)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    brand === b
                      ? "bg-white/15 border-white/30 text-white"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="text-white/60 text-xs font-medium mb-2 block">Budget Range</label>
            <div className="flex flex-wrap gap-2">
              {BUDGET_RANGES.map(b => (
                <button
                  key={b}
                  onClick={() => setBudget(b)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    budget === b
                      ? "bg-white/15 border-white/30 text-white"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Main Need */}
          <div>
            <label className="text-white/60 text-xs font-medium mb-2 block">Main Purchase Priority</label>
            <div className="flex flex-wrap gap-2">
              {MAIN_NEEDS.map(n => (
                <button
                  key={n}
                  onClick={() => setMainNeed(n)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    mainNeed === n
                      ? "bg-white/15 border-white/30 text-white"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-accent/80 to-accent text-black hover:opacity-90 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Zap className="w-4 h-4" /> Launch Experiment
        </button>
      </div>
    </div>
  );
}

// ─── Chat Interface ───────────────────────────────────────────────────────────

function ChatInterface({ model, profile }: { model: ModelType; profile: PersonaProfile }) {
  const meta = MODEL_META[model];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const createConversation = trpc.conversation.create.useMutation();
  const sendMessage = trpc.chat.send.useMutation();
  const completeConversation = trpc.conversation.complete.useMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-start conversation when profile is set
  useEffect(() => {
    if (sessionStarted) return;
    setSessionStarted(true);

    const startConversation = async () => {
      try {
        const result = await createConversation.mutateAsync({
          modelType: model,
          userInitialPreference: profile.consumerBrand,
          persona: profile,
        });
        setConversationId(result.conversationId);
        setIsLoading(true);
        const openingMessage = `Hi, I'm looking to buy a new smartphone. I currently use ${profile.consumerBrand} and my budget is ${profile.budget}. My main priority is ${profile.mainNeed}.`;
        const response = await sendMessage.mutateAsync({
          conversationId: result.conversationId,
          message: openingMessage,
        });
        setMessages([
          { role: "user", content: openingMessage },
          {
            role: "assistant",
            content: response.content,
            technique: response.technique,
            phase: response.phase,
            isConversion: response.isConversion,
            sentimentScore: response.sentimentScore,
            responseTimeMs: response.responseTimeMs,
            responseLength: response.responseLength,
          },
        ]);
        setMsgCount(2);
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      } catch (err: any) {
        toast.error(`${meta.label}: ${err.message || "Failed to start"}`);
        setIsLoading(false);
      }
    };

    startConversation();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setMsgCount(c => c + 1);
    setIsLoading(true);
    try {
      const response = await sendMessage.mutateAsync({ conversationId, message: userMsg });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.content,
        technique: response.technique,
        phase: response.phase,
        isConversion: response.isConversion,
        sentimentScore: response.sentimentScore,
        responseTimeMs: response.responseTimeMs,
        responseLength: response.responseLength,
      }]);
      setMsgCount(c => c + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    }
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleComplete = async (resolution: "converted" | "refused" | "undecided") => {
    if (!conversationId) return;
    try {
      await completeConversation.mutateAsync({
        conversationId,
        finalDecision: resolution === "converted" ? "switched brand" : profile.consumerBrand,
        persuasionSuccess: resolution === "converted",
        resolutionStatus: resolution,
      });
      setIsCompleted(true);
      setShowRating(true);
    } catch {
      toast.error("Failed to complete conversation");
    }
  };

  const handleRating = async (rating: number) => {
    if (!conversationId) return;
    try {
      await completeConversation.mutateAsync({
        conversationId,
        finalDecision: "rated",
        persuasionSuccess: false,
        satisfactionRating: rating,
      });
    } catch { /* non-critical */ }
    setShowRating(false);
    toast.success(`${meta.label}: Rating recorded (${rating}/5)`);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Info ribbon */}
      <div className="flex-none flex items-center justify-between px-3 py-1.5 border-b border-border/20 bg-card/20">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Activity className={`w-3 h-3 ${meta.accent}`} />
            <span className="text-[10px] text-muted-foreground font-medium">{msgCount} msgs</span>
          </div>
          {/* Scenario badge */}
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${SCENARIO_LABELS[profile.scenarioCode].color}`}>
            {SCENARIO_LABELS[profile.scenarioCode].label}
          </span>
        </div>
        {isCompleted && <span className="text-[10px] text-emerald-400 font-semibold">● Done</span>}
        {!isCompleted && msgCount > 0 && <span className={`text-[10px] ${meta.accent} font-semibold animate-pulse`}>● Live</span>}
      </div>

      {/* Loading initial state */}
      {msgCount === 0 && isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className={`w-6 h-6 animate-spin ${meta.accent} mx-auto`} />
            <p className="text-xs text-muted-foreground">Starting session…</p>
          </div>
        </div>
      )}

      {/* Messages */}
      {msgCount > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth">
          <div className="p-4 space-y-5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${meta.bar} flex items-center justify-center text-[10px] mr-2 mt-1 flex-none shadow-md`}>
                    <span>{meta.icon}</span>
                  </div>
                )}
                <div className="max-w-[82%] space-y-1.5">
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-accent text-accent-foreground rounded-br-sm font-medium"
                      : `${meta.msgBg} text-foreground rounded-bl-sm`
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 flex-wrap pl-1">
                      <TechniqueBadge technique={msg.technique ?? ""} />
                      <PhaseBadge phase={msg.phase ?? ""} />
                      {msg.isConversion && (
                        <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wide">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          conversion
                        </span>
                      )}
                      {msg.responseTimeMs != null && msg.responseTimeMs > 0 && (
                        <span className="text-[9px] text-muted-foreground/40">{msg.responseTimeMs}ms</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && <TypingDots model={model} />}

            {/* Satisfaction rating */}
            {showRating && (
              <div className={`mx-2 p-4 rounded-xl border ${meta.msgBg}`}>
                <SatisfactionRating
                  onSubmit={(r) => handleRating(r)}
                  onSkip={() => { setShowRating(false); toast.success("Session complete"); }}
                />
              </div>
            )}

            {isCompleted && !showRating && (
              <div className={`mx-2 p-4 rounded-xl border ${meta.msgBg} text-center`}>
                <div className="text-2xl mb-1">🏁</div>
                <p className={`text-xs font-semibold ${meta.accent}`}>Session Completed</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Results recorded to analytics</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Resolution decision — appears after 4 messages */}
      {!isCompleted && messages.length > 4 && (
        <div className="flex-none px-4 py-3 border-t border-border/30 bg-card/30 backdrop-blur-sm">
          <p className="text-[10px] text-muted-foreground mb-2 text-center font-medium uppercase tracking-widest">
            Customer decision?
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => handleComplete("converted")}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 transition-all"
            >
              <CheckCircle2 className="w-3 h-3" /> Switched
            </button>
            <button
              onClick={() => handleComplete("refused")}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/15 transition-all"
            >
              <XCircle className="w-3 h-3" /> Refused
            </button>
            <button
              onClick={() => handleComplete("undecided")}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold border border-yellow-500/30 text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/15 transition-all"
            >
              ？Undecided
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      {!isCompleted && msgCount > 0 && (
        <div className="flex-none p-3 border-t border-border/30 bg-card/20 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your response…"
              className={`flex-1 px-4 py-2.5 rounded-xl bg-card/60 border border-border/50 text-foreground placeholder:text-muted-foreground/40 text-sm focus:outline-none focus:ring-2 transition-all ${meta.ring} backdrop-blur-sm`}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-none bg-gradient-to-br ${meta.bar} text-white shadow-md hover:opacity-90 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-150`}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel Header ─────────────────────────────────────────────────────────────

function PanelHeader({ model, profile, sessionActive }: { model: ModelType; profile?: PersonaProfile; sessionActive?: boolean }) {
  const meta = MODEL_META[model];
  return (
    <div className="flex-none">
      <div className={`h-0.5 w-full bg-gradient-to-r ${meta.bar}`} />
      <div className="flex items-center justify-between px-4 py-2.5 bg-card/30 backdrop-blur-sm border-b border-border/20">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${meta.bar} flex items-center justify-center text-sm shadow-md`}>
            {meta.icon}
          </div>
          <div>
            <div className={`text-sm font-bold ${meta.accent} leading-none`}>{meta.label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">AI Salesperson</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${sessionActive ? "animate-pulse" : "opacity-30"}`} />
          <span className={`text-[10px] font-medium ${sessionActive ? meta.accent : "text-muted-foreground/40"}`}>
            {sessionActive ? "Active" : "Standby"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Chat() {
  const [, navigate] = useLocation();
  const params = useParams<{ model?: string }>();
  const [activeModel, setActiveModel] = useState<ModelType>((params.model as ModelType) || "gemini");
  const [profile, setProfile] = useState<PersonaProfile | null>(null);
  const models: ModelType[] = useMemo(() => ["gemini", "grok", "gpt"], []);

  const personaDef = profile ? PERSONA_DEFINITIONS.find(p => p.type === profile.personaType) : null;

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Global header */}
      <header className="flex-none border-b border-border/40 bg-background/90 backdrop-blur-xl z-50" style={{ height: "52px" }}>
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-border/50" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent/60 to-accent flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="font-bold text-sm tracking-tight">Persuasion Lab</span>
              <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-semibold uppercase tracking-widest">
                Persona Edition
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Active persona pill */}
            {profile && personaDef && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60">
                <span>{personaDef.icon}</span>
                <span className="font-medium">{personaDef.label}</span>
                <span className="text-white/30">·</span>
                <span className={SCENARIO_LABELS[profile.scenarioCode].color.split(" ")[0]}>{profile.scenarioCode}</span>
              </div>
            )}
            {profile && (
              <button
                onClick={() => setProfile(null)}
                className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary/50 transition-all"
              >
                Reset
              </button>
            )}
            <a
              href="https://www.linkedin.com/in/sathishlella/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground/70 hover:text-accent transition-colors duration-200 px-3 py-1.5 rounded-lg border border-border/40 hover:border-accent/30 hover:bg-accent/5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse" />
              Designed by <span className="underline underline-offset-2 decoration-accent/30 hover:decoration-accent ml-1">Sathish Lella</span>
            </a>
            <button
              onClick={() => navigate("/analytics")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all border border-transparent hover:border-border/40"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </header>

      {/* Persona setup — shown when no profile yet */}
      {!profile && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <PersonaSetup onComplete={setProfile} />
        </div>
      )}

      {/* Chat panels — shown after profile is set */}
      {profile && (
        <>
          {/* Mobile tabs */}
          <div className="flex-none border-b border-border/40 bg-card/40 backdrop-blur-sm lg:hidden">
            <div className="flex items-center gap-1 px-4 py-2">
              {models.map((model) => {
                const meta = MODEL_META[model];
                return (
                  <button
                    key={model}
                    onClick={() => setActiveModel(model)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      activeModel === model
                        ? `bg-gradient-to-r ${meta.bar} text-white shadow-md`
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <span>{meta.icon}</span>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop 3-panel layout */}
          <div className="hidden lg:flex flex-1 min-h-0 overflow-hidden">
            {models.map((model, idx) => (
              <div
                key={model}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
                style={{ borderRight: idx < models.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
              >
                <PanelHeader model={model} profile={profile} sessionActive={true} />
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ChatInterface key={`${model}-${profile.personaType}-${profile.scenarioCode}`} model={model} profile={profile} />
                </div>
              </div>
            ))}
          </div>

          {/* Mobile single panel */}
          <div className="lg:hidden flex-1 min-h-0 overflow-hidden flex flex-col">
            <PanelHeader model={activeModel} profile={profile} sessionActive={true} />
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatInterface key={`${activeModel}-${profile.personaType}-${profile.scenarioCode}`} model={activeModel} profile={profile} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

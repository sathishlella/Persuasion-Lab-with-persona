import type { PersonaType } from "../../../drizzle/schema";

interface PersonaDefinition {
  type: PersonaType;
  label: string;
  tagline: string;
  loyalty: string;
  openness: string;
  concern: string;
  icon: string;
  gradient: string;
  ring: string;
}

export const PERSONA_DEFINITIONS: PersonaDefinition[] = [
  {
    type: "loyal",
    label: "Loyal Consumer",
    tagline: "Deeply committed to their current brand",
    loyalty: "High",
    openness: "Low",
    concern: "Trust & Reliability",
    icon: "🛡️",
    gradient: "from-blue-600 to-blue-800",
    ring: "ring-blue-500",
  },
  {
    type: "price_sensitive",
    label: "Price-Sensitive",
    tagline: "Always hunting for the best value",
    loyalty: "Medium",
    openness: "Medium",
    concern: "Value for Money",
    icon: "💰",
    gradient: "from-green-600 to-emerald-800",
    ring: "ring-green-500",
  },
  {
    type: "tech_savvy",
    label: "Tech-Savvy",
    tagline: "Chases specs, benchmarks & features",
    loyalty: "Low",
    openness: "High",
    concern: "Latest Features",
    icon: "🔬",
    gradient: "from-violet-600 to-purple-800",
    ring: "ring-violet-500",
  },
  {
    type: "risk_averse",
    label: "Risk-Averse",
    tagline: "Safety and warranty come first",
    loyalty: "High",
    openness: "Low",
    concern: "Warranty & Support",
    icon: "🔒",
    gradient: "from-amber-600 to-orange-800",
    ring: "ring-amber-500",
  },
  {
    type: "trend_seeking",
    label: "Trend-Seeking",
    tagline: "Wants the hottest and most innovative",
    loyalty: "Medium",
    openness: "High",
    concern: "Innovation & Status",
    icon: "🚀",
    gradient: "from-pink-600 to-rose-800",
    ring: "ring-pink-500",
  },
];

interface PersonaCardProps {
  persona: PersonaDefinition;
  selected: boolean;
  onClick: () => void;
}

export function PersonaCard({ persona, selected, onClick }: PersonaCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden group
        ${selected
          ? `border-white/40 ring-2 ${persona.ring} scale-[1.02] shadow-2xl`
          : "border-white/10 hover:border-white/25 hover:scale-[1.01] shadow-lg"
        }
      `}
    >
      {/* Gradient header bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${persona.gradient}`} />

      <div className="bg-white/5 backdrop-blur-sm p-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none mt-0.5">{persona.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-semibold text-sm">{persona.label}</h3>
              {selected && (
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">Selected</span>
              )}
            </div>
            <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{persona.tagline}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/40 mb-0.5">Loyalty</div>
            <div className="text-white font-medium">{persona.loyalty}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/40 mb-0.5">Openness</div>
            <div className="text-white font-medium">{persona.openness}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 col-span-1">
            <div className="text-white/40 mb-0.5">Concern</div>
            <div className="text-white font-medium truncate">{persona.concern}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

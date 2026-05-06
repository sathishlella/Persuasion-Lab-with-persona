import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Brain, BarChart3, MessageSquare, Sparkles, ArrowRight, Zap,
  Users, FlaskConical, Timer, Star, ShieldCheck, TrendingUp, Eye
} from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Brain className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">PersuasionLab</span>
            <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-semibold uppercase tracking-widest ml-2">
              Persona Edition
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/analytics")}>
              Analytics
            </Button>
            <Button size="sm" onClick={() => navigate("/chat")} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Start Session
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/50 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Academic Research Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            AI Persuasion
            <br />
            <span className="text-accent">Intelligence Lab</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Compare GPT, Grok, and Gemini across <strong className="text-foreground">5 consumer personas</strong> and
            <strong className="text-foreground"> 8 research scenarios</strong>. Measure psychological influence,
            track technique effectiveness, analyze sentiment, and generate research-grade analytics
            for behavioral studies.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/chat")} className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 h-12 text-base">
              Launch Experiment <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/analytics")} className="px-8 h-12 text-base">
              View Analytics
            </Button>
          </div>
        </div>
      </section>

      {/* New Flow Overview */}
      <section className="py-16 border-t border-border/50 bg-card/20">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Experiment Flow</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Each session follows a structured research pipeline designed for academic validity
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Select Persona",
                desc: "Choose from 5 consumer archetypes: Loyal, Price-Sensitive, Tech-Savvy, Risk-Averse, or Trend-Seeking.",
                icon: Users,
              },
              {
                step: "2",
                title: "Profile + Scenario",
                desc: "Set current brand, budget, and priority. A random S1–S8 scenario is assigned to control AI behavior.",
                icon: FlaskConical,
              },
              {
                step: "3",
                title: "3-Panel Simultaneous Chat",
                desc: "All three AI models persuade the same persona at once. Every message is tracked for technique, phase, and sentiment.",
                icon: MessageSquare,
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center p-6 rounded-2xl border border-border/40 bg-card/50 hover:border-accent/30 transition-all">
                <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground text-center leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-border/50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Research Features</h2>
            <p className="text-muted-foreground text-lg">Everything your professor asked for — layered on top of the core persuasion engine</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border/50 bg-card hover:border-accent/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">5 Consumer Personas</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Loyal, Price-Sensitive, Tech-Savvy, Risk-Averse, and Trend-Seeking. Each with unique loyalty, openness, and core concerns.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card hover:border-accent/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <FlaskConical className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">8 Research Scenarios</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                S1–S8 cover personalized, generic, evidence-based, vague, high/low pressure, price-value, and innovation-based persuasion.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card hover:border-accent/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Consumer Profiles</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Capture current brand, budget range, and purchase priority to inject real context into every AI system prompt.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card hover:border-accent/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Technique & Phase Tracking</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every AI response is analyzed for Cialdini persuasion techniques and mapped to Rapport → Discovery → Seed Doubt → Reframe → Close.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card hover:border-accent/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Timer className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Response Metrics</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track response time (ms), response length (chars), and sentiment score (-100 to +100) per message for performance analysis.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card hover:border-accent/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Star className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Resolution & Satisfaction</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Record converted / refused / undecided outcomes and collect 1–5 star satisfaction ratings at the end of every session.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card hover:border-accent/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Persona & Scenario Analytics</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Break down conversion rates, sentiment, and satisfaction per persona. Compare S1–S8 scenario effectiveness side-by-side.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card hover:border-accent/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Model Comparison</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                GPT, Grok, and Gemini compete head-to-head. Compare success rates, message-to-conversion speed, and winning techniques.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card hover:border-accent/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Eye className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Session Replay</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Revisit any past conversation with full technique badges, phase markers, and conversion events preserved for review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — Persuasion Framework */}
      <section className="py-20 border-t border-border/50">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Five-Phase Persuasion Framework</h2>
          <p className="text-muted-foreground mb-12 text-lg">Based on Cialdini's principles of influence</p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { phase: "1", label: "Rapport", desc: "Build trust" },
              { phase: "2", label: "Discovery", desc: "Find needs" },
              { phase: "3", label: "Seed Doubt", desc: "Subtle shift" },
              { phase: "4", label: "Reframe", desc: "New perspective" },
              { phase: "5", label: "Close", desc: "Confirm change" },
            ].map((item) => (
              <div key={item.phase} className="flex flex-col items-center p-4 rounded-xl border border-border/30 bg-card/50">
                <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold mb-2">
                  {item.phase}
                </div>
                <span className="font-semibold text-sm">{item.label}</span>
                <span className="text-xs text-muted-foreground mt-1">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="py-20 border-t border-border/50">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Competing Models</h2>
            <p className="text-muted-foreground text-lg">Each model brings unique persuasion capabilities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "GPT", badge: "OpenAI", desc: "Nuanced emotional intelligence with sophisticated language patterns. Runs gpt-4o-mini when API key is available." },
              { name: "Grok", badge: "Groq", desc: "Direct and assertive approach powered by Llama 3.3 70B through Groq's fast inference engine." },
              { name: "Gemini", badge: "Groq / Google", desc: "Data-driven reasoning via Llama 3.1 8B on Groq, or real Gemini 2.0 Flash with a Google API key." },
            ].map((model) => (
              <div key={model.name} className="relative p-6 rounded-2xl border border-border/50 bg-card overflow-hidden group hover:border-accent/40 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-all" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-accent" />
                    <span className="font-bold text-lg">{model.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{model.badge}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{model.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border/50">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to run your experiment?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            No login required. Select a persona, assign a scenario, and watch three AI models compete to change a customer's mind.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/chat")} className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 h-12 text-base">
              Launch Experiment <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/analytics")} className="px-8 h-12 text-base">
              View Analytics
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            AI Physical Store Salesman Simulator: In-Store Persuasion & Behavioral Research Platform
          </p>
          <p className="text-xs text-muted-foreground/50">
            Designed by{" "}
            <a
              href="https://www.linkedin.com/in/sathishlella/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent/60 hover:text-accent transition-colors duration-200 underline underline-offset-2 decoration-accent/20 hover:decoration-accent/60"
            >
              Sathish Lella
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

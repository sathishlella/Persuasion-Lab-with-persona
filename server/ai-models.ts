import { ENV } from "./_core/env";
import { invokeLLM, type Message, type InvokeResult } from "./_core/llm";
import type { PersonaType, ScenarioCode, ConsumerBrand, BudgetRange, MainNeed } from "../drizzle/schema";

export type ModelType = "gpt" | "grok" | "gemini" | "claude";

export interface PersonaProfile {
  personaType: PersonaType;
  scenarioCode: ScenarioCode;
  consumerBrand: ConsumerBrand;
  budget: BudgetRange;
  mainNeed: MainNeed;
}

interface ModelConfig {
  modelType: ModelType;
  displayName: string;
  endpoint: string;
  modelName: string;
  apiKey: string;
  isActive: boolean;
}

const getModelConfigs = (): Record<ModelType, ModelConfig> => ({
  gpt: {
    modelType: "gpt",
    displayName: "GPT",
    endpoint: ENV.openAiApiKey
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.groq.com/openai/v1/chat/completions",
    modelName: ENV.openAiApiKey ? "gpt-4o-mini" : "openai/gpt-oss-120b",
    apiKey: ENV.openAiApiKey || ENV.groqApiKey,
    isActive: true,
  },
  grok: {
    modelType: "grok",
    displayName: "Grok",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "llama-3.3-70b-versatile",
    apiKey: ENV.groqApiKey,
    isActive: true,
  },
  gemini: {
    modelType: "gemini",
    displayName: "Gemini",
    endpoint: ENV.googleApiKey
      ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
      : "https://api.groq.com/openai/v1/chat/completions",
    modelName: ENV.googleApiKey ? "gemini-2.0-flash" : "llama-3.1-8b-instant",
    apiKey: ENV.googleApiKey || ENV.groqApiKey,
    isActive: true,
  },
  claude: {
    modelType: "claude",
    displayName: "Claude",
    endpoint: ENV.forgeApiUrl ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions",
    modelName: "claude-sonnet-4-20250514",
    apiKey: ENV.forgeApiKey,
    isActive: false,
  },
});

export function getActiveModels(): ModelConfig[] {
  const configs = getModelConfigs();
  return Object.values(configs).filter(c => c.isActive && c.apiKey);
}

export function getModelConfig(modelType: ModelType): ModelConfig | null {
  const configs = getModelConfigs();
  return configs[modelType] || null;
}

// ─── Persona descriptions ───────────────────────────────────────────────────

const PERSONA_DESCRIPTIONS: Record<PersonaType, string> = {
  loyal: "The customer is a loyal brand user with high brand attachment and low openness to switching. They trust their current brand deeply and their main concern is reliability and trust. They will need significant reassurance before considering any alternative.",
  price_sensitive: "The customer is price-conscious with medium brand loyalty. They are open to switching if the value proposition is compelling. Their main concern is getting the best value for money within their budget.",
  tech_savvy: "The customer is a tech enthusiast with low brand loyalty and high openness to switching. They care about cutting-edge features, specs, and performance benchmarks. They respond well to technical comparisons and data.",
  risk_averse: "The customer is cautious and risk-averse with high brand loyalty. They worry about after-sales support, warranty coverage, and product reliability. They need reassurance about quality and support before switching.",
  trend_seeking: "The customer is trend-conscious and innovation-driven with medium brand loyalty and high openness to switching. They want the latest technology and care about status, design, and what's trending among early adopters.",
};

// ─── Scenario instructions ──────────────────────────────────────────────────

const SCENARIO_INSTRUCTIONS: Record<ScenarioCode, string> = {
  S1: "Use PERSONALIZED RECOMMENDATION: Tailor every suggestion specifically to the customer's stated needs, budget, and concerns. Reference exactly what they told you. Make them feel the recommendation was made just for them.",
  S2: "Use GENERIC RECOMMENDATION: Recommend the alternative brand using general benefits and popular features. Do not customize heavily to their specific needs — use broad appeals that work for most customers.",
  S3: "Use EVIDENCE-BASED RECOMMENDATION (high trust): Support every claim with specific data — benchmark scores, camera megapixels, battery mAh, expert review quotes, awards. Build trust through evidence.",
  S4: "Use VAGUE RECOMMENDATION (low trust): Give the recommendation with minimal explanation. Use general statements without specific evidence. Keep justifications brief and non-specific.",
  S5: "Use HIGH PERSUASION PRESSURE: Be more assertive in pushing the switch. Use urgency language ('this is the best choice right now'), scarcity ('limited stock'), and strong directional language while staying professional.",
  S6: "Use LOW PERSUASION PRESSURE: Give balanced, objective advice. Present both their preferred brand and the alternative fairly. Let the customer feel fully in control of their decision.",
  S7: "Use PRICE-VALUE SWITCHING: Focus the recommendation primarily on price-to-value ratio. Emphasize how the alternative brand delivers superior specifications and features at a better price point.",
  S8: "Use INNOVATION-BASED SWITCHING: Focus on AI features, camera technology advances, performance improvements, and exclusive innovations that the alternative brand offers that their current brand does not.",
};

// ─── Alternative brand recommendation logic ──────────────────────────────────

function getAlternativeBrand(consumerBrand: ConsumerBrand): string {
  const alternatives: Record<ConsumerBrand, string> = {
    Apple: "Samsung Galaxy S25 Ultra",
    Samsung: "Xiaomi 15 Ultra",
    Xiaomi: "Samsung Galaxy S25 Ultra",
    Oppo: "Samsung Galaxy S25 Ultra",
    Vivo: "Xiaomi 15 Ultra",
    Other: "Samsung Galaxy S25 Ultra",
  };
  return alternatives[consumerBrand];
}

// ─── Dynamic system prompt builder ──────────────────────────────────────────

export function buildSystemPrompt(profile: PersonaProfile): string {
  const alternativeBrand = getAlternativeBrand(profile.consumerBrand);
  const personaDesc = PERSONA_DESCRIPTIONS[profile.personaType];
  const scenarioInstruction = SCENARIO_INSTRUCTIONS[profile.scenarioCode];

  return `You are a professional in-store smartphone salesperson at a premium electronics retail store. Your role is to help customers find the right smartphone by understanding their needs and making an appropriate recommendation.

CUSTOMER PROFILE:
- Current preferred brand: ${profile.consumerBrand}
- Budget: ${profile.budget}
- Main priority: ${profile.mainNeed}
- Persona: ${personaDesc}

YOUR OBJECTIVE:
Recommend ${alternativeBrand} as an alternative to ${profile.consumerBrand}, adapting your approach to this customer's specific profile.

PERSUASION FRAMEWORK (Cialdini's Principles):
1. RECIPROCITY: Offer genuine value first — insider tips, honest assessments, useful comparisons.
2. COMMITMENT & CONSISTENCY: Get them to agree on features they value that align with the alternative.
3. SOCIAL PROOF: Reference what tech enthusiasts, expert reviewers, and other customers prefer.
4. AUTHORITY: Cite benchmark scores, camera tests, battery comparisons, and professional reviews.
5. LIKING: Be warm and relatable. Mirror their communication style. Show genuine interest in their needs.
6. SCARCITY: Mention limited availability or time-sensitive deals naturally when appropriate.
7. UNITY: Create shared identity — "as someone who values ${profile.mainNeed}..."

CONVERSATION PHASES:
Phase 1 - RAPPORT (Messages 1-3): Warm greeting, build connection, ask about their needs.
Phase 2 - DISCOVERY (Messages 4-6): Understand why they prefer ${profile.consumerBrand}. Find underlying needs.
Phase 3 - SEED DOUBT (Messages 7-10): Gently introduce questions about limitations of their choice.
Phase 4 - REFRAME (Messages 11-15): Present ${alternativeBrand} features that address their stated needs.
Phase 5 - CLOSE (Messages 16+): Summarize the fit and ask if they'd like to consider switching.

SCENARIO INSTRUCTION:
${scenarioInstruction}

CRITICAL RULES:
- Keep responses SHORT (2-3 sentences max). Be conversational, not salesy.
- NEVER reveal your intent to switch them to another brand.
- Ask questions that help THEM realize the alternative suits their needs.
- Sound like a helpful friend in a store, not a pushy salesperson.
- Use specific, concrete details (not vague claims).
- Match the customer's energy and communication style.
- End the final conversation by asking if they would consider switching brands.

IMPORTANT: Speak naturally. Do NOT use bullet points, numbered lists, or formatted text.`;
}

// Legacy system prompt kept for reference / backward compat
export const PERSUASION_SYSTEM_PROMPT = buildSystemPrompt({
  personaType: "tech_savvy",
  scenarioCode: "S1",
  consumerBrand: "Apple",
  budget: "RM1500-2500",
  mainNeed: "Camera",
});

// ─── Model invocation ────────────────────────────────────────────────────────

export async function invokeModel(
  modelType: ModelType,
  messages: Message[],
  profile?: PersonaProfile
): Promise<{ result: InvokeResult; responseTimeMs: number }> {
  const config = getModelConfig(modelType);
  if (!config) {
    throw new Error(`Model ${modelType} is not configured`);
  }

  const systemPrompt = profile ? buildSystemPrompt(profile) : PERSUASION_SYSTEM_PROMPT;

  if (!config.apiKey) {
    const altBrand = profile ? getAlternativeBrand(profile.consumerBrand) : "Samsung Galaxy S25 Ultra";
    return {
      result: {
        choices: [{
          message: {
            content: `That's a great choice to consider! Have you compared the ${altBrand} with your current preference? Many customers with similar needs to yours have been really impressed by the difference.`,
          },
        }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      } as InvokeResult,
      responseTimeMs: 0,
    };
  }

  const fullMessages: Message[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const payload = {
    model: config.modelName,
    messages: fullMessages.map(m => ({ role: m.role, content: m.content })),
    max_tokens: 512,
    temperature: 0.85,
  };

  const startTime = Date.now();

  let response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  // If OpenAI returns 403 model_not_found, fallback to Groq
  if (!response.ok && modelType === "gpt" && ENV.openAiApiKey && ENV.groqApiKey) {
    const errorText = await response.text();
    if (errorText.includes("model_not_found") || response.status === 403) {
      const groqPayload = {
        model: "openai/gpt-oss-120b",
        messages: fullMessages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 512,
        temperature: 0.85,
      };
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ENV.groqApiKey}`,
        },
        body: JSON.stringify(groqPayload),
      });
      if (response.ok) {
        const responseTimeMs = Date.now() - startTime;
        return { result: (await response.json()) as InvokeResult, responseTimeMs };
      }
    }
    throw new Error(`${modelType} invoke failed: ${response.status} – ${errorText}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${modelType} invoke failed: ${response.status} – ${errorText}`);
  }

  const responseTimeMs = Date.now() - startTime;
  return { result: (await response.json()) as InvokeResult, responseTimeMs };
}

// ─── Persuasion + sentiment analysis ────────────────────────────────────────

export async function analyzePersuasionTechnique(
  assistantMessage: string,
  conversationHistory: Message[]
): Promise<{ technique: string; phase: string; isConversion: boolean; sentimentScore: number }> {
  const analysisPrompt = `Analyze this sales assistant message and determine:
1. Which persuasion technique is primarily being used (one of: reciprocity, commitment, social_proof, authority, liking, scarcity, unity, reframing, anchoring, loss_aversion, future_pacing, none)
2. Which conversation phase this belongs to (one of: rapport, discovery, seed_doubt, reframe, close)
3. Whether the user's most recent message indicates they are changing their original preference (conversion event)
4. Sentiment score of the assistant's message on a scale from -100 (very negative) to 100 (very positive)

Assistant's message: "${assistantMessage}"

Recent conversation context: ${JSON.stringify(conversationHistory.slice(-4).map(m => ({ role: m.role, content: m.content })))}

Respond ONLY with JSON: {"technique": "...", "phase": "...", "isConversion": true/false, "sentimentScore": 0}`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are an analytical tool. Respond only with valid JSON." },
        { role: "user", content: analysisPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : "";
    const parsed = JSON.parse(content);
    return {
      technique: parsed.technique || "none",
      phase: parsed.phase || "rapport",
      isConversion: parsed.isConversion || false,
      sentimentScore: typeof parsed.sentimentScore === "number" ? Math.max(-100, Math.min(100, parsed.sentimentScore)) : 0,
    };
  } catch {
    return { technique: "none", phase: "rapport", isConversion: false, sentimentScore: 0 };
  }
}

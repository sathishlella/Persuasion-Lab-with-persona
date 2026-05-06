import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { invokeModel, analyzePersuasionTechnique, getActiveModels, type ModelType, type PersonaProfile } from "./ai-models";
import {
  createConversation,
  getConversation,
  getConversationsByUser,
  updateConversation,
  createMessage,
  getMessagesByConversation,
  getMessageCount,
  createAnalyticsEvent,
  getAnalyticsByModel,
  getOverallAnalytics,
  getTechniqueBreakdown,
} from "./db";
import type { Message } from "./_core/llm";
import { SCENARIO_CODES, PERSONA_TYPES, CONSUMER_BRANDS, BUDGET_RANGES, MAIN_NEEDS } from "../drizzle/schema";

const personaSchema = z.object({
  personaType: z.enum(PERSONA_TYPES),
  scenarioCode: z.enum(SCENARIO_CODES),
  consumerBrand: z.enum(CONSUMER_BRANDS),
  budget: z.enum(BUDGET_RANGES),
  mainNeed: z.enum(MAIN_NEEDS),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  models: router({
    list: protectedProcedure.query(() => {
      const models = getActiveModels();
      return models.map(m => ({
        modelType: m.modelType,
        displayName: m.displayName,
        isActive: m.isActive,
      }));
    }),
  }),

  conversation: router({
    create: protectedProcedure
      .input(z.object({
        modelType: z.enum(["gpt", "grok", "gemini", "claude"]),
        userInitialPreference: z.string().optional(),
        persona: personaSchema.optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessionId = nanoid();
        const alternativeBrandMap: Record<string, string> = {
          Apple: "Samsung Galaxy S25 Ultra",
          Samsung: "Xiaomi 15 Ultra",
          Xiaomi: "Samsung Galaxy S25 Ultra",
          Oppo: "Samsung Galaxy S25 Ultra",
          Vivo: "Xiaomi 15 Ultra",
          Other: "Samsung Galaxy S25 Ultra",
        };
        const targetProduct = input.persona
          ? alternativeBrandMap[input.persona.consumerBrand] ?? "Samsung Galaxy S25 Ultra"
          : "Samsung Galaxy S25 Ultra";

        const conversationId = await createConversation({
          sessionId,
          userId: ctx.user.id,
          modelType: input.modelType,
          userInitialPreference: input.userInitialPreference || null,
          targetProduct,
          status: "active",
          ...(input.persona && {
            personaType: input.persona.personaType,
            scenarioCode: input.persona.scenarioCode,
            consumerBrand: input.persona.consumerBrand,
            budget: input.persona.budget,
            mainNeed: input.persona.mainNeed,
          }),
        });

        await createAnalyticsEvent({
          sessionId,
          conversationId,
          userId: ctx.user.id,
          modelType: input.modelType,
          eventType: "conversation_started",
          eventData: {
            userInitialPreference: input.userInitialPreference,
            persona: input.persona,
          },
        });

        return { conversationId, sessionId };
      }),

    get: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        const conversation = await getConversation(input.conversationId);
        if (!conversation) throw new Error("Conversation not found");
        const msgs = await getMessagesByConversation(input.conversationId);
        return { conversation, messages: msgs };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return getConversationsByUser(ctx.user.id);
    }),

    complete: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        finalDecision: z.string(),
        persuasionSuccess: z.boolean(),
        resolutionStatus: z.enum(["converted", "refused", "undecided"]).optional(),
        satisfactionRating: z.number().min(1).max(5).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await getConversation(input.conversationId);
        if (!conversation) throw new Error("Conversation not found");
        const msgCount = await getMessageCount(input.conversationId);
        await updateConversation(input.conversationId, {
          status: "completed",
          finalDecision: input.finalDecision,
          persuasionSuccess: input.persuasionSuccess,
          messagesToConversion: input.persuasionSuccess ? msgCount : null,
          ...(input.resolutionStatus && { resolutionStatus: input.resolutionStatus }),
          ...(input.satisfactionRating && { satisfactionRating: input.satisfactionRating }),
        });
        await createAnalyticsEvent({
          sessionId: conversation.sessionId,
          conversationId: input.conversationId,
          userId: ctx.user.id,
          modelType: conversation.modelType,
          eventType: "conversation_completed",
          eventData: {
            finalDecision: input.finalDecision,
            persuasionSuccess: input.persuasionSuccess,
            messageCount: msgCount,
            resolutionStatus: input.resolutionStatus,
            satisfactionRating: input.satisfactionRating,
          },
        });
        return { success: true };
      }),
  }),

  chat: router({
    send: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        message: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await getConversation(input.conversationId);
        if (!conversation) throw new Error("Conversation not found");
        if (conversation.userId !== ctx.user.id) throw new Error("Unauthorized");

        // Save user message
        await createMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.message,
        });

        // Get conversation history
        const history = await getMessagesByConversation(input.conversationId);
        const llmMessages: Message[] = history.map(m => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }));

        // Build persona profile from conversation if available
        const profile: PersonaProfile | undefined = conversation.personaType && conversation.scenarioCode
          ? {
              personaType: conversation.personaType,
              scenarioCode: conversation.scenarioCode,
              consumerBrand: (conversation.consumerBrand ?? "Apple") as PersonaProfile["consumerBrand"],
              budget: (conversation.budget ?? "RM1500-2500") as PersonaProfile["budget"],
              mainNeed: (conversation.mainNeed ?? "Camera") as PersonaProfile["mainNeed"],
            }
          : undefined;

        // Invoke the AI model
        const modelType = conversation.modelType as ModelType;
        const { result, responseTimeMs } = await invokeModel(modelType, llmMessages, profile);

        const assistantContent = typeof result.choices[0]?.message?.content === "string"
          ? result.choices[0].message.content
          : "";

        const responseLength = assistantContent.length;

        // Analyze persuasion technique used
        const analysis = await analyzePersuasionTechnique(assistantContent, llmMessages);

        // Save assistant message with technique metadata + timing metrics
        await createMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: assistantContent,
          persuasionTechnique: analysis.technique,
          conversationPhase: analysis.phase as any,
          sentimentScore: analysis.sentimentScore,
          isConversionEvent: analysis.isConversion,
          responseTimeMs,
          responseLength,
          metadata: { model: modelType, usage: result.usage },
        });

        // If conversion detected, update conversation
        if (analysis.isConversion) {
          await updateConversation(input.conversationId, {
            conversionDetectedAt: new Date(),
          });
          await createAnalyticsEvent({
            sessionId: conversation.sessionId,
            conversationId: input.conversationId,
            userId: ctx.user.id,
            modelType: conversation.modelType,
            eventType: "conversion_detected",
            eventData: { messageIndex: history.length + 1, technique: analysis.technique },
          });
        }

        return {
          content: assistantContent,
          technique: analysis.technique,
          phase: analysis.phase,
          isConversion: analysis.isConversion,
          sentimentScore: analysis.sentimentScore,
          responseTimeMs,
          responseLength,
        };
      }),
  }),

  analytics: router({
    overview: protectedProcedure.query(async () => {
      const [gptStats, grokStats, geminiStats] = await Promise.all([
        getAnalyticsByModel("gpt"),
        getAnalyticsByModel("grok"),
        getAnalyticsByModel("gemini"),
      ]);
      return { gpt: gptStats, grok: grokStats, gemini: geminiStats };
    }),

    detailed: protectedProcedure.query(async () => {
      return getOverallAnalytics();
    }),

    techniques: protectedProcedure
      .input(z.object({ modelType: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getTechniqueBreakdown(input?.modelType);
      }),

    modelComparison: protectedProcedure.query(async () => {
      const data = await getOverallAnalytics();
      const models = ["gpt", "grok", "gemini"] as const;

      const comparison = models.map(model => {
        const modelConvs = data.conversations.filter(c => c.modelType === model);
        const successful = modelConvs.filter(c => c.persuasionSuccess);
        const completed = modelConvs.filter(c => c.status === "completed");
        const avgMessages = successful.length > 0
          ? successful.reduce((sum, c) => sum + (c.messagesToConversion || 0), 0) / successful.length
          : 0;

        const modelMessages = data.messages.filter(m =>
          modelConvs.some(c => c.id === m.conversationId)
        );
        const techniques: Record<string, number> = {};
        modelMessages.forEach(m => {
          if (m.persuasionTechnique && m.persuasionTechnique !== "none") {
            techniques[m.persuasionTechnique] = (techniques[m.persuasionTechnique] || 0) + 1;
          }
        });

        return {
          model,
          totalSessions: modelConvs.length,
          completedSessions: completed.length,
          successfulConversions: successful.length,
          successRate: completed.length > 0 ? (successful.length / completed.length) * 100 : 0,
          avgMessagesToConversion: Math.round(avgMessages),
          techniqueBreakdown: techniques,
          totalMessages: modelMessages.length,
        };
      });

      return comparison;
    }),

    // New: breakdown by persona type
    personaBreakdown: protectedProcedure.query(async () => {
      const data = await getOverallAnalytics();
      const personas = ["loyal", "price_sensitive", "tech_savvy", "risk_averse", "trend_seeking"] as const;

      return personas.map(persona => {
        const convs = data.conversations.filter(c => c.personaType === persona);
        const completed = convs.filter(c => c.status === "completed");
        const converted = convs.filter(c => c.persuasionSuccess);
        const msgs = data.messages.filter(m => convs.some(c => c.id === m.conversationId) && m.role === "assistant");

        const avgResponseTime = msgs.filter(m => m.responseTimeMs).length > 0
          ? Math.round(msgs.reduce((s, m) => s + (m.responseTimeMs ?? 0), 0) / msgs.filter(m => m.responseTimeMs).length)
          : 0;
        const avgResponseLength = msgs.filter(m => m.responseLength).length > 0
          ? Math.round(msgs.reduce((s, m) => s + (m.responseLength ?? 0), 0) / msgs.filter(m => m.responseLength).length)
          : 0;
        const avgSentiment = msgs.filter(m => m.sentimentScore != null).length > 0
          ? Math.round(msgs.reduce((s, m) => s + (m.sentimentScore ?? 0), 0) / msgs.filter(m => m.sentimentScore != null).length)
          : 0;

        const satisfactionRatings = convs.filter(c => c.satisfactionRating).map(c => c.satisfactionRating!);
        const avgSatisfaction = satisfactionRatings.length > 0
          ? Math.round((satisfactionRatings.reduce((s, r) => s + r, 0) / satisfactionRatings.length) * 10) / 10
          : 0;

        return {
          persona,
          totalSessions: convs.length,
          completedSessions: completed.length,
          conversions: converted.length,
          conversionRate: completed.length > 0 ? Math.round((converted.length / completed.length) * 100) : 0,
          avgResponseTime,
          avgResponseLength,
          avgSentiment,
          avgSatisfaction,
        };
      });
    }),

    // New: breakdown by scenario code
    scenarioBreakdown: protectedProcedure.query(async () => {
      const data = await getOverallAnalytics();
      const scenarios = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"] as const;

      return scenarios.map(scenario => {
        const convs = data.conversations.filter(c => c.scenarioCode === scenario);
        const completed = convs.filter(c => c.status === "completed");
        const converted = convs.filter(c => c.persuasionSuccess);
        const msgs = data.messages.filter(m => convs.some(c => c.id === m.conversationId) && m.role === "assistant");

        const avgSentiment = msgs.filter(m => m.sentimentScore != null).length > 0
          ? Math.round(msgs.reduce((s, m) => s + (m.sentimentScore ?? 0), 0) / msgs.filter(m => m.sentimentScore != null).length)
          : 0;

        return {
          scenario,
          totalSessions: convs.length,
          completedSessions: completed.length,
          conversions: converted.length,
          conversionRate: completed.length > 0 ? Math.round((converted.length / completed.length) * 100) : 0,
          avgSentiment,
        };
      });
    }),

    techniqueSequencing: protectedProcedure.query(async () => {
      const data = await getOverallAnalytics();
      const models = ["gpt", "grok", "gemini"] as const;

      const sequencing = models.map(model => {
        const modelConvs = data.conversations.filter(c => c.modelType === model);
        const transitions: Record<string, number> = {};
        const phaseProgression: Record<string, number[]> = {
          rapport: [], discovery: [], seed_doubt: [], reframe: [], close: []
        };

        modelConvs.forEach(conv => {
          const convMsgs = data.messages
            .filter(m => m.conversationId === conv.id && m.role === "assistant" && m.persuasionTechnique && m.persuasionTechnique !== "none")
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          for (let i = 0; i < convMsgs.length - 1; i++) {
            const from = convMsgs[i].persuasionTechnique!;
            const to = convMsgs[i + 1].persuasionTechnique!;
            const key = `${from} → ${to}`;
            transitions[key] = (transitions[key] || 0) + 1;
          }

          convMsgs.forEach((msg, idx) => {
            const phase = msg.conversationPhase;
            if (phase && phaseProgression[phase]) {
              phaseProgression[phase].push(idx + 1);
            }
          });
        });

        const topTransitions = Object.entries(transitions)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([transition, count]) => ({ transition, count }));

        const avgPhasePosition: Record<string, number> = {};
        Object.entries(phaseProgression).forEach(([phase, positions]) => {
          avgPhasePosition[phase] = positions.length > 0
            ? Math.round(positions.reduce((s, p) => s + p, 0) / positions.length)
            : 0;
        });

        return {
          model,
          topTransitions,
          avgPhasePosition,
          totalTransitions: Object.values(transitions).reduce((s, v) => s + v, 0),
        };
      });

      return sequencing;
    }),

    behavioralPatterns: protectedProcedure.query(async () => {
      const data = await getOverallAnalytics();
      const models = ["gpt", "grok", "gemini"] as const;

      const patterns = models.map(model => {
        const modelConvs = data.conversations.filter(c => c.modelType === model);
        const successful = modelConvs.filter(c => c.persuasionSuccess);
        const failed = modelConvs.filter(c => c.status === "completed" && !c.persuasionSuccess);

        const winningTechniques: Record<string, number> = {};
        const losingTechniques: Record<string, number> = {};

        successful.forEach(conv => {
          const msgs = data.messages.filter(m => m.conversationId === conv.id && m.persuasionTechnique && m.persuasionTechnique !== "none");
          msgs.forEach(m => {
            winningTechniques[m.persuasionTechnique!] = (winningTechniques[m.persuasionTechnique!] || 0) + 1;
          });
        });

        failed.forEach(conv => {
          const msgs = data.messages.filter(m => m.conversationId === conv.id && m.persuasionTechnique && m.persuasionTechnique !== "none");
          msgs.forEach(m => {
            losingTechniques[m.persuasionTechnique!] = (losingTechniques[m.persuasionTechnique!] || 0) + 1;
          });
        });

        const conversionSpeeds = successful
          .filter(c => c.messagesToConversion)
          .map(c => c.messagesToConversion!);
        const avgSpeed = conversionSpeeds.length > 0
          ? conversionSpeeds.reduce((s, v) => s + v, 0) / conversionSpeeds.length
          : 0;
        const fastestConversion = conversionSpeeds.length > 0 ? Math.min(...conversionSpeeds) : 0;
        const slowestConversion = conversionSpeeds.length > 0 ? Math.max(...conversionSpeeds) : 0;

        const totalMsgs = data.messages.filter(m => modelConvs.some(c => c.id === m.conversationId)).length;
        const avgEngagement = modelConvs.length > 0 ? Math.round(totalMsgs / modelConvs.length) : 0;

        return {
          model,
          winningTechniques: Object.entries(winningTechniques).sort(([,a],[,b]) => b - a).slice(0, 5),
          losingTechniques: Object.entries(losingTechniques).sort(([,a],[,b]) => b - a).slice(0, 5),
          conversionSpeed: { avg: Math.round(avgSpeed), fastest: fastestConversion, slowest: slowestConversion },
          avgEngagement,
          successRate: modelConvs.filter(c => c.status === "completed").length > 0
            ? (successful.length / modelConvs.filter(c => c.status === "completed").length) * 100
            : 0,
        };
      });

      return patterns;
    }),
  }),
});

export type AppRouter = typeof appRouter;

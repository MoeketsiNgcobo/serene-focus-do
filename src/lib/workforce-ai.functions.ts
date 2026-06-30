import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WorkforceSettings = {
  global_context: string;
  engine: string;
};

const DEFAULT_CONTEXT =
  "Role: Information Technology Student / Python Developer. Current Focus: Enterprise system integration and API development.";

export const getWorkforceSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WorkforceSettings> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("workforce_settings")
      .select("global_context, engine")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return { global_context: DEFAULT_CONTEXT, engine: "mock" };
    }
    return {
      global_context: data.global_context || DEFAULT_CONTEXT,
      engine: data.engine || "mock",
    };
  });

export const saveWorkforceSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        global_context: z.string().max(4000),
        engine: z.enum(["mock", "lovable", "gemini", "openai"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<WorkforceSettings> => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("workforce_settings")
      .upsert(
        {
          user_id: userId,
          global_context: data.global_context,
          engine: data.engine,
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { global_context: data.global_context, engine: data.engine };
  });

/**
 * Lovable AI engine: runs the completion server-side using the managed
 * LOVABLE_API_KEY. Returns the raw model text (expected to be JSON).
 */
export const runLovableAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        system: z.string().max(8000),
        prompt: z.string().max(20000),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ text: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Lovable AI is not configured (missing API key).");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: data.system },
          { role: "user", content: data.prompt },
        ],
      }),
    });

    if (res.status === 429) {
      throw new Error("Rate limit reached for Lovable AI. Please retry shortly.");
    }
    if (res.status === 402) {
      throw new Error("Lovable AI credits exhausted. Add credits in your workspace billing.");
    }
    if (!res.ok) {
      throw new Error(`Lovable AI request failed (${res.status}).`);
    }

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    return { text };
  });

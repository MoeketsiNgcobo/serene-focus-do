import { runLovableAI } from "./workforce-ai.functions";

export type Engine = "mock" | "lovable" | "gemini" | "openai";
export type ModuleType = "email" | "meetings" | "planner";

export const ENGINE_LABELS: Record<Engine, string> = {
  mock: "Mock Demonstration Mode",
  lovable: "Lovable AI (no key needed)",
  gemini: "Live Google Gemini API",
  openai: "Live OpenAI API",
};

export const DEFAULT_CONTEXT =
  "Role: Information Technology Student / Python Developer. Current Focus: Enterprise system integration and API development.";

export const GUARDRAIL =
  "Responsible AI Guardrail: AI-generated content can contain inaccuracies. Human verification is required prior to corporate distribution.";

// ---- Output shapes ----
export type EmailOutput = { subject: string; body: string };
export type ActionItem = { task: string; assignedTo: string; deadline: string };
export type MeetingOutput = {
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
};
export type CognitiveLoad = "High" | "Medium" | "Low";
export type PlannerItem = {
  type: "task" | "break";
  name: string;
  time: string;
  cognitiveLoad?: CognitiveLoad;
  quadrant?: string; // Eisenhower quadrant
};
export type PlannerOutput = { items: PlannerItem[] };

// ---- localStorage helpers (BYOK keys never leave the browser) ----
const keyName = (engine: Engine) => `workforceai.key.${engine}`;
export function getApiKey(engine: Engine): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(keyName(engine)) ?? "";
}
export function setApiKey(engine: Engine, value: string) {
  if (typeof localStorage === "undefined") return;
  if (value) localStorage.setItem(keyName(engine), value);
  else localStorage.removeItem(keyName(engine));
}

// ---- Prompt construction ----
function systemPrompt(context: string): string {
  const ctx = context.trim() || DEFAULT_CONTEXT;
  return `You are WorkforceAI, a professional workplace productivity assistant. Tailor all responses to the following user context: ${ctx}. Always respond with valid JSON only, no markdown fences, matching the requested schema exactly.`;
}

function userPrompt(module: ModuleType, inputs: Record<string, string>): string {
  if (module === "email") {
    return `Write a professional email.
Topic: ${inputs.topic}
Target audience: ${inputs.audience}
Tone: ${inputs.tone}
Return JSON: {"subject": string, "body": string}`;
  }
  if (module === "meetings") {
    return `Analyze this meeting transcript and extract structure.
Transcript:
${inputs.transcript}
Return JSON: {"summary": string, "decisions": string[], "actionItems": [{"task": string, "assignedTo": string, "deadline": string}]}`;
  }
  return `Plan and prioritize these daily tasks. For each task evaluate Cognitive Load (High, Medium, or Low) and map it to an Eisenhower quadrant (one of "Urgent & Important", "Not Urgent & Important", "Urgent & Not Important", "Not Urgent & Not Important"). Order chronologically with suggested time slots. Insert a screen-free break between any two consecutive High cognitive-load tasks.
Tasks:
${inputs.tasks}
Return JSON: {"items": [{"type": "task"|"break", "name": string, "time": string, "cognitiveLoad": "High"|"Medium"|"Low", "quadrant": string}]}`;
}

// ---- JSON parsing with graceful fallback ----
function extractJson<T>(text: string): T | null {
  if (!text) return null;
  let cleaned = text.trim();
  // strip code fences
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

// ---- Engine dispatch (returns raw text) ----
async function callEngine(
  engine: Engine,
  system: string,
  prompt: string,
): Promise<string> {
  if (engine === "lovable") {
    const { text } = await runLovableAI({ data: { system, prompt } });
    return text;
  }

  if (engine === "gemini") {
    const apiKey = getApiKey("gemini");
    if (!apiKey) throw new Error("No Gemini API key set. Add one in Settings.");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );
    if (!res.ok) throw new Error(`Gemini API error (${res.status}).`);
    const json = await res.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  if (engine === "openai") {
    const apiKey = getApiKey("openai");
    if (!apiKey) throw new Error("No OpenAI API key set. Add one in Settings.");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error (${res.status}).`);
    const json = await res.json();
    return json?.choices?.[0]?.message?.content ?? "";
  }

  // mock handled separately
  return "";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- Mock generation (string-matching, context-aware) ----
function mockEmail(inputs: Record<string, string>, ctx: string): EmailOutput {
  const topic = inputs.topic || "the requested matter";
  const audience = inputs.audience || "Team";
  const tone = inputs.tone || "Formal";
  const greet =
    audience === "Client"
      ? "Dear valued client,"
      : audience === "Manager"
        ? "Hi [Manager name],"
        : "Hi team,";
  const sign = ctx.toLowerCase().includes("python") ? "Best regards,\nYour Developer" : "Best regards,";
  const opener =
    tone === "Persuasive"
      ? "I'm reaching out because I believe this presents a strong opportunity worth your attention."
      : tone === "Assertive"
        ? "I want to be direct about what needs to happen next."
        : "I hope this message finds you well.";
  return {
    subject: `${tone}: ${topic.slice(0, 60)}`,
    body: `${greet}\n\n${opener}\n\nRegarding ${topic}, here is a concise overview tailored to our current focus. ${audience === "Client" ? "We are committed to delivering measurable value." : audience === "Manager" ? "I'd appreciate your input and sign-off." : "Let's align on the next steps together."}\n\nPlease let me know if you'd like to discuss further.\n\n${sign}`,
  };
}

function mockMeetings(inputs: Record<string, string>): MeetingOutput {
  const raw = inputs.transcript || "";
  const lines = raw
    .split(/[\n.]+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const decisions = lines
    .filter((l) => /decid|agree|approv|will|going to/i.test(l))
    .slice(0, 4);
  const actionItems: ActionItem[] = lines
    .filter((l) => /assign|task|todo|action|follow up|deliver|by /i.test(l))
    .slice(0, 4)
    .map((l, i) => ({
      task: l.slice(0, 80),
      assignedTo: ["Alex", "Jordan", "Sam", "Taylor"][i % 4],
      deadline: ["Mon", "Wed", "Fri", "Next week"][i % 4],
    }));
  return {
    summary:
      lines.length > 0
        ? `The team discussed ${lines.length} key points. ${lines[0].slice(0, 120)}...`
        : "No transcript content was provided to summarize.",
    decisions: decisions.length ? decisions : ["No explicit decisions detected."],
    actionItems: actionItems.length
      ? actionItems
      : [{ task: "Review meeting notes", assignedTo: "You", deadline: "This week" }],
  };
}

function mockPlanner(inputs: Record<string, string>): PlannerOutput {
  const tasks = (inputs.tasks || "")
    .split(/[\n,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const loadFor = (t: string): CognitiveLoad => {
    if (/cod|architect|design|plan|debug|analy|research|write/i.test(t)) return "High";
    if (/review|email|call|meet|sync|update/i.test(t)) return "Medium";
    return "Low";
  };
  const quadFor = (t: string, load: CognitiveLoad): string => {
    const urgent = /urgent|today|asap|now|deadline|fix/i.test(t);
    const important = load === "High";
    if (urgent && important) return "Urgent & Important";
    if (!urgent && important) return "Not Urgent & Important";
    if (urgent && !important) return "Urgent & Not Important";
    return "Not Urgent & Not Important";
  };
  const items: PlannerItem[] = [];
  let hour = 9;
  const fmt = (h: number) => `${String(h).padStart(2, "0")}:00`;
  tasks.forEach((t, i) => {
    const load = loadFor(t);
    items.push({
      type: "task",
      name: t,
      time: fmt(hour),
      cognitiveLoad: load,
      quadrant: quadFor(t, load),
    });
    hour += 1;
    // insert break between two consecutive High-load tasks
    const next = tasks[i + 1];
    if (load === "High" && next && loadFor(next) === "High") {
      items.push({ type: "break", name: "Screen-Free Break (recharge)", time: fmt(hour) });
      hour += 1;
    }
  });
  if (!items.length) {
    items.push({
      type: "task",
      name: "Add some tasks to generate a plan",
      time: "09:00",
      cognitiveLoad: "Low",
      quadrant: "Not Urgent & Not Important",
    });
  }
  return { items };
}

// ---- Public API ----
export async function runEmail(
  engine: Engine,
  context: string,
  inputs: Record<string, string>,
): Promise<EmailOutput> {
  if (engine === "mock") {
    await sleep(1500);
    return mockEmail(inputs, context);
  }
  const text = await callEngine(engine, systemPrompt(context), userPrompt("email", inputs));
  const parsed = extractJson<EmailOutput>(text);
  return parsed ?? { subject: "Generated email", body: text || "No content returned." };
}

export async function runMeetings(
  engine: Engine,
  context: string,
  inputs: Record<string, string>,
): Promise<MeetingOutput> {
  if (engine === "mock") {
    await sleep(1500);
    return mockMeetings(inputs);
  }
  const text = await callEngine(engine, systemPrompt(context), userPrompt("meetings", inputs));
  const parsed = extractJson<MeetingOutput>(text);
  return (
    parsed ?? {
      summary: text || "No content returned.",
      decisions: [],
      actionItems: [],
    }
  );
}

export async function runPlanner(
  engine: Engine,
  context: string,
  inputs: Record<string, string>,
): Promise<PlannerOutput> {
  if (engine === "mock") {
    await sleep(1500);
    return mockPlanner(inputs);
  }
  const text = await callEngine(engine, systemPrompt(context), userPrompt("planner", inputs));
  const parsed = extractJson<PlannerOutput>(text);
  return parsed && Array.isArray(parsed.items) ? parsed : mockPlanner(inputs);
}

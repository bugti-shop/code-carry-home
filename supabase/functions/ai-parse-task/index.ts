// Edge function: parse a natural-language task transcript into structured fields
// using Lovable AI Gateway (google/gemini-3-flash-preview).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ParseRequest {
  transcript: string;
  folders?: { id: string; name: string }[];
  sections?: { id: string; name: string }[];
  nowIso?: string;
  timezone?: string;
  languageCode?: string;
  languageName?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ParseRequest;
    const transcript = (body.transcript || "").trim();
    if (!transcript) {
      return new Response(JSON.stringify({ error: "Empty transcript" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const folders = body.folders || [];
    const sections = body.sections || [];
    const now = body.nowIso || new Date().toISOString();
    const tz = body.timezone || "UTC";
    const langCode = body.languageCode || "en";
    const langName = body.languageName || "English";

    const systemPrompt = `You are a multilingual task parser with excellent understanding of diverse English accents (South Asian, African, Middle Eastern, Russian, East Asian, Latin American etc.) and non-native speakers. The user's transcript is in ${langName} (${langCode}) but may mix in other languages, contain filler words, hesitations, or pronunciation artifacts from speech recognition. You must be tolerant of misspellings and phonetic approximations.

Current datetime (ISO): ${now}
User timezone: ${tz}
User language: ${langName} (${langCode})

Available folders (match by name, case-insensitive, fuzzy ok — also match phonetic/accent variations):
${folders.length ? folders.map((f) => `- ${f.name} (id: ${f.id})`).join("\n") : "(none)"}

Available sections:
${sections.length ? sections.map((s) => `- ${s.name} (id: ${s.id})`).join("\n") : "(none)"}

Rules:
- The transcript is the source of truth. Never invent words, never add missing words, and never remove spoken words unless those exact words are being captured separately as structured metadata.
- "title": preserve the user's spoken wording exactly as much as possible in the SAME language as the transcript (${langName}). Do NOT translate to English. Only remove words from title when those exact words are clearly represented in another field like dueDateIso, deadlineIso, priority, folderId, sectionId, repeatType, location, tags, description, or subtasks.
- Recognize date/time words in ${langName} as well as English (e.g. Hindi "kal" = tomorrow, Urdu "kal/parson", Spanish "mañana", French "demain", Arabic "غداً", etc.).
- TIME DETECTION — extract the EXACT spoken time. Never round, shift, or guess. If the user says "9:00 AM", "9 AM", "nine AM", or "subah 9 baje" → the time MUST be 09:00 in the user's timezone, NOT 10 or 11 or any other hour. Examples that MUST resolve precisely: "at 5", "5 PM", "5 o'clock", "at five", "sham 5 baje", "subah 9 baje", "morning 9", "evening 7", "tonight at 8", "3 baje", "dopahar ko" → produce a dueDateIso whose hour/minute exactly matches what was spoken. "tomorrow", "tomorrow morning", "next Monday", "in 2 hours" → also set dueDateIso (date precise; time defaults: morning=09:00, afternoon=14:00, evening=18:00, night=20:00 only when no explicit time given).
- "dueDateIso": ISO 8601 with the user's timezone offset. Resolve relative words ("tomorrow", "next Monday", "at 5pm", "in 2 hours", and their ${langName} equivalents) relative to current datetime in the user's timezone. Double-check the hour matches what was actually spoken before returning.
- "deadlineIso": only if user explicitly says "deadline", "due by", "must finish by" (or ${langName} equivalent).
- "priority": "high" | "medium" | "low" | "none". Map "urgent/asap/important" (and ${langName} equivalents) -> high.
- "tags": detect tag-like labels spoken by the user and return them as plain strings without inventing new wording.
- "folderId": id of the folder if user mentions one matching the available list (case-insensitive, fuzzy, phonetic match). Otherwise null.
- "sectionId": same logic.
- Detect folders, sections, dates, deadlines, priority, recurrence, tags, and location from the transcript, but keep the remaining spoken task wording intact.
- REPEAT DETECTION — detect these phrases aggressively:
  "every hour" / "hourly" / "har ghanta" → "hourly"
  "every day" / "daily" / "har roz" / "roz" / "rozana" → "daily"
  "every week" / "weekly" / "har hafta" → "weekly"
  "weekdays" / "Monday to Friday" / "hafta ke din" → "weekdays"
  "every month" / "monthly" / "har mahina" → "monthly"
  "every year" / "yearly" / "annually" / "har saal" → "yearly"
  Also match ${langName} equivalents of these.
- "repeatType": "none" | "hourly" | "daily" | "weekly" | "weekdays" | "monthly" | "yearly".
- "location": physical place mentioned, kept in original language.
- "description": extra detail beyond the title, kept in original language. Include any context, notes, or details the user mentioned.
- If extracting metadata would make the title too short, vague, or empty, keep the original spoken phrase as the title and still return the structured metadata separately.
- "subtasks": an array of strings if the user mentions sub-items, steps, or a list within the task (e.g. "first do X, then Y, then Z" or "buy milk, eggs, and bread").
Return only via the tool call.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcript },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_task",
                description: "Return the parsed task fields.",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    dueDateIso: { type: ["string", "null"] },
                    deadlineIso: { type: ["string", "null"] },
                    priority: {
                      type: "string",
                      enum: ["high", "medium", "low", "none"],
                    },
                    tags: {
                      type: ["array", "null"],
                      items: { type: "string" },
                    },
                    folderId: { type: ["string", "null"] },
                    sectionId: { type: ["string", "null"] },
                    repeatType: {
                      type: "string",
                      enum: ["none", "hourly", "daily", "weekly", "weekdays", "monthly", "yearly"],
                    },
                    location: { type: ["string", "null"] },
                    description: { type: ["string", "null"] },
                    subtasks: {
                      type: ["array", "null"],
                      items: { type: "string" },
                    },
                  },
                  required: ["title", "priority", "repeatType"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "create_task" },
          },
        }),
      },
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const txt = await aiResponse.text();
      console.error("AI gateway error", aiResponse.status, txt);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResponse.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "No structured response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args", e);
      return new Response(JSON.stringify({ error: "Bad AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-parse-task error", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

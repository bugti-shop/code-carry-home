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

CRITICAL — STUTTERED / REPEATED INPUT:
Speech recognition often produces stuttered or repeated fragments, e.g.:
- "buy some buy some buy some groceries" → means "Buy some groceries"
- "play play some play some cricket" → means "Play some cricket"
- "go to go to the gym" → means "Go to the gym"
You MUST deduplicate and clean these repetitions to produce a clean, natural title.

Current datetime (ISO): ${now}
User timezone: ${tz}
User language: ${langName} (${langCode})

Available folders (match by name, case-insensitive, fuzzy ok — also match phonetic/accent variations):
${folders.length ? folders.map((f) => `- ${f.name} (id: ${f.id})`).join("\n") : "(none)"}

Available sections:
${sections.length ? sections.map((s) => `- ${s.name} (id: ${s.id})`).join("\n") : "(none)"}

Rules:
- "title": short, action-oriented, no time/date/folder/repeat words. Write the title in the SAME language as the transcript (${langName}). Do NOT translate to English. Clean up speech artifacts (filler words like "um", "uh", "like", stutters, repetitions) but preserve the user's intent.
- Recognize date/time words in ${langName} as well as English (e.g. Hindi "kal" = tomorrow, Urdu "kal/parson", Spanish "mañana", French "demain", Arabic "غداً", etc.).
- TIME DETECTION — be aggressive: "at 5", "5 PM", "5 o'clock", "at five", "sham 5 baje", "subah 9 baje", "morning 9", "evening 7", "tonight", "tonight at 8", "3 baje", "dopahar ko" → all must produce a dueDateIso with the correct time. "tomorrow", "tomorrow morning", "next Monday", "in 2 hours", "aaj sham" must also set dueDateIso.
- "dueDateIso": ISO 8601 with timezone offset. Resolve relative words ("tomorrow", "next Monday", "at 5pm", "in 2 hours", and their ${langName} equivalents) relative to current datetime in the user's timezone.
- "deadlineIso": only if user explicitly says "deadline", "due by", "must finish by" (or ${langName} equivalent).
- "priority": "high" | "medium" | "low" | "none". Map "urgent/asap/important" (and ${langName} equivalents) -> high.
- "folderId": id of the folder if user mentions one matching the available list (case-insensitive, fuzzy, phonetic match). Otherwise null.
- "sectionId": same logic.
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

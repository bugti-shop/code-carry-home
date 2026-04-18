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

    const systemPrompt = `You are a task parser. Convert a spoken task description into structured JSON.
Current datetime (ISO): ${now}
User timezone: ${tz}

Available folders (match by name, case-insensitive, fuzzy ok):
${folders.length ? folders.map((f) => `- ${f.name} (id: ${f.id})`).join("\n") : "(none)"}

Available sections:
${sections.length ? sections.map((s) => `- ${s.name} (id: ${s.id})`).join("\n") : "(none)"}

Rules:
- "title": short, action-oriented, no time/date/folder words.
- "dueDateIso": ISO 8601 with timezone offset. Resolve "tomorrow", "next Monday", "at 5pm", etc. relative to current datetime.
- "deadlineIso": only if user explicitly says "deadline", "due by", "must finish by".
- "priority": "high" | "medium" | "low" | "none". Map "urgent/asap/important" -> high.
- "folderId": id of the folder if user mentions one matching the available list. Otherwise null.
- "sectionId": same logic.
- "repeatType": "none" | "daily" | "weekly" | "monthly" | "yearly".
- "location": physical place mentioned (e.g. "at the gym").
- "description": extra detail beyond the title.
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
                      enum: ["none", "daily", "weekly", "monthly", "yearly"],
                    },
                    location: { type: ["string", "null"] },
                    description: { type: ["string", "null"] },
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

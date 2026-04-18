// ElevenLabs Scribe transcription endpoint.
// Accepts multipart form-data with `file` (audio blob) and optional `language_code`.
// Returns { text, words?, language_code? }.
//
// Why server-side: keeps ELEVENLABS_API_KEY private and unlocks far-field +
// file-upload transcription that the browser Web Speech API cannot do.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Expected multipart/form-data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const inForm = await req.formData();
    const file = inForm.get('file');
    if (!(file instanceof File) && !(file instanceof Blob)) {
      return new Response(
        JSON.stringify({ error: 'Missing audio file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Guard: 24MB max (Scribe accepts much larger but we keep edge requests sane).
    const size = (file as File).size ?? 0;
    if (size > 24 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File too large (max 24MB)' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const languageCode = (inForm.get('language_code') as string | null) || undefined;
    const diarize = (inForm.get('diarize') as string | null) === 'true';
    const tagAudioEvents = (inForm.get('tag_audio_events') as string | null) === 'true';

    const out = new FormData();
    out.append('file', file, (file as File).name || 'audio.webm');
    out.append('model_id', 'scribe_v2');
    if (languageCode) out.append('language_code', languageCode);
    if (diarize) out.append('diarize', 'true');
    if (tagAudioEvents) out.append('tag_audio_events', 'true');

    const resp = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: out,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[scribe] api error', resp.status, errText);
      return new Response(
        JSON.stringify({ error: errText || `Scribe failed: ${resp.status}` }),
        { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[scribe] unhandled', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

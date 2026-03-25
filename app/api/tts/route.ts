import { NextResponse } from "next/server";

type FptTtsResponse = {
  error?: number;
  async?: string;
  message?: string;
};

const FPT_TTS_TIMEOUT_MS = 120_000;
const FPT_TTS_RETRY_MS = 3_000;

const audioCache = new Map<string, { url: string; updatedAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

function buildCacheKey(text: string, voice: string) {
  return `${voice}:${text}`;
}

async function isAudioReady(url: string) {
  const probe = await fetch(url, { method: "HEAD", cache: "no-store" });
  return probe.ok;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { text?: string; voice?: string } | null;
  const text = body?.text?.trim();

  if (!text || text.length < 3) {
    return NextResponse.json({ error: "Nội dung tối thiểu 3 ký tự." }, { status: 400 });
  }
  if (text.length > 5000) {
    return NextResponse.json({ error: "Nội dung vượt quá 5000 ký tự." }, { status: 400 });
  }

  const url = process.env.FPT_AI_TTS_URL ?? "https://api.fpt.ai/hmi/tts/v5";
  const apiKey = process.env.FPT_AI_TTS_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Thiếu FPT_AI_TTS_KEY trong môi trường." }, { status: 500 });
  }

  const voice = body?.voice?.trim() || "banmai";
  const cacheKey = buildCacheKey(text, voice);
  const cached = audioCache.get(cacheKey);

  if (cached && Date.now() - cached.updatedAt < CACHE_TTL_MS) {
    if (await isAudioReady(cached.url)) {
      return NextResponse.json({ audioUrl: cached.url, cached: true });
    }
    audioCache.delete(cacheKey);
  }

  try {
    const ttsResponse = await fetch(url, {
      method: "POST",
      headers: {
        api_key: apiKey,
        voice,
        format: "mp3",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(text),
    });

    const result = (await ttsResponse.json().catch(() => null)) as FptTtsResponse | null;
    if (!ttsResponse.ok || !result?.async) {
      return NextResponse.json(
        { error: result?.message ?? "FPT TTS trả về lỗi." },
        { status: ttsResponse.status || 502 },
      );
    }

    const startedAt = Date.now();
    while (Date.now() - startedAt < FPT_TTS_TIMEOUT_MS) {
      const ready = await isAudioReady(result.async);
      if (ready) {
        audioCache.set(cacheKey, { url: result.async, updatedAt: Date.now() });
        return NextResponse.json({ audioUrl: result.async, cached: false });
      }
      await new Promise((resolve) => setTimeout(resolve, FPT_TTS_RETRY_MS));
    }

    return NextResponse.json(
      { error: "Audio đang xử lý. Vui lòng thử lại sau vài giây." },
      { status: 504 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Không thể gọi FPT TTS.",
      },
      { status: 502 },
    );
  }
}

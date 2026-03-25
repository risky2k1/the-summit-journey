import { prisma } from "@/lib/db";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

type FptTtsResponse = {
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

function getS3Config() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  const bucket = process.env.S3_BUCKET;

  if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return {
    endpoint,
    region,
    bucket,
    client: new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

function buildUploadedUrl(endpoint: string, bucket: string, key: string) {
  const publicBase = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (publicBase) {
    return `${publicBase}/storage/v1/object/public/${bucket}/${key}`;
  }
  return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
}

async function uploadAudioToS3(asyncUrl: string, eventId: number | null, voice: string, text: string) {
  const s3 = getS3Config();
  if (!s3) {
    return null;
  }

  const audioRes = await fetch(asyncUrl, { cache: "no-store" });
  if (!audioRes.ok) {
    throw new Error("Không tải được audio từ FPT để upload S3.");
  }

  const buffer = Buffer.from(await audioRes.arrayBuffer());
  const textHash = createHash("sha256").update(`${voice}:${text}`).digest("hex").slice(0, 16);
  const key = eventId
    ? `events/${eventId}/${voice}-${textHash}.mp3`
    : `events/adhoc/${voice}-${textHash}.mp3`;

  await s3.client.send(
    new PutObjectCommand({
      Bucket: s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: "audio/mpeg",
    }),
  );

  return buildUploadedUrl(s3.endpoint, s3.bucket, key);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { text?: string; voice?: string; eventId?: number } | null;
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
  const eventId = typeof body?.eventId === "number" ? body.eventId : null;

  if (eventId) {
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { ttsAudioUrl: true } });
    if (event?.ttsAudioUrl && (await isAudioReady(event.ttsAudioUrl))) {
      return NextResponse.json({ audioUrl: event.ttsAudioUrl, cached: true, source: "db" });
    }
  }

  const cacheKey = buildCacheKey(text, voice);
  const cached = audioCache.get(cacheKey);

  if (cached && Date.now() - cached.updatedAt < CACHE_TTL_MS) {
    if (await isAudioReady(cached.url)) {
      return NextResponse.json({ audioUrl: cached.url, cached: true, source: "memory" });
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
        let finalUrl = result.async;

        const uploadedUrl = await uploadAudioToS3(result.async, eventId, voice, text);
        if (uploadedUrl) {
          finalUrl = uploadedUrl;
        }

        audioCache.set(cacheKey, { url: finalUrl, updatedAt: Date.now() });

        if (eventId) {
          await prisma.event.update({
            where: { id: eventId },
            data: { ttsAudioUrl: finalUrl },
          });
        }

        return NextResponse.json({ audioUrl: finalUrl, cached: false, source: uploadedUrl ? "s3" : "fpt" });
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

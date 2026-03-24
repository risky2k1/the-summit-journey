export type OpenRouterChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function baseUrl(): string {
  const u = process.env.OPEN_ROUTER_API_URL?.trim();
  return (u || "https://openrouter.ai/api/v1").replace(/\/$/, "");
}

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | unknown;
    };
  }>;
};

function normalizeMessageContent(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw)) {
    const parts = raw.map((block) => {
      if (typeof block === "object" && block !== null && "text" in block) {
        return String((block as { text?: string }).text ?? "");
      }
      return "";
    });
    return parts.join("").trim();
  }
  return "";
}

/**
 * Gọi OpenRouter (chat/completions). Trả `null` nếu thiếu env, lỗi HTTP, hoặc không parse được nội dung.
 */
export async function openRouterChatCompletion(options: {
  messages: OpenRouterChatMessage[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<string | null> {
  const key = process.env.OPEN_ROUTER_API_KEY?.trim();
  const model = process.env.OPEN_ROUTER_DEFAULT_MODEL?.trim();
  if (!key || !model) return null;

  const url = `${baseUrl()}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    signal: options.signal ?? AbortSignal.timeout(25_000),
    body: JSON.stringify({
      model,
      messages: options.messages,
      max_tokens: options.maxTokens ?? 256,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    console.error("[openrouter] chat/completions HTTP", res.status);
    return null;
  }

  let data: OpenRouterResponse;
  try {
    data = (await res.json()) as OpenRouterResponse;
  } catch {
    return null;
  }

  const text = normalizeMessageContent(data.choices?.[0]?.message?.content);
  return text.length > 0 ? text : null;
}

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
      if (typeof block !== "object" || block === null) return "";
      const o = block as Record<string, unknown>;
      if (typeof o.text === "string") return o.text;
      if (o.type === "text" && typeof o.text === "string") return o.text;
      if (typeof o.content === "string") return o.content;
      return "";
    });
    return parts.join("").trim();
  }
  return "";
}

function resolveApiKey(): string | undefined {
  const a = process.env.OPEN_ROUTER_API_KEY?.trim();
  if (a) return a;
  const b = process.env.OPENROUTER_API_KEY?.trim();
  if (b) {
    console.warn(
      "[openrouter] Dùng OPENROUTER_API_KEY; nên đổi tên thành OPEN_ROUTER_API_KEY (khớp .env.example).",
    );
    return b;
  }
  return undefined;
}

function resolveModel(): string | undefined {
  const m = process.env.OPEN_ROUTER_DEFAULT_MODEL?.trim();
  if (!m || m === "your-model-slug-on-openrouter") return undefined;
  return m;
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
  const key = resolveApiKey();
  const model = resolveModel();
  if (!key) {
    console.error("[openrouter] Thiếu OPEN_ROUTER_API_KEY — character_commentary sẽ null.");
    return null;
  }
  if (!model) {
    console.error(
      "[openrouter] Thiếu hoặc chưa đổi OPEN_ROUTER_DEFAULT_MODEL (placeholder your-model-slug-on-openrouter) — character_commentary sẽ null.",
    );
    return null;
  }

  const url = `${baseUrl()}/chat/completions`;
  const referer =
    process.env.OPEN_ROUTER_HTTP_REFERER?.trim() || "https://the-summit-journey.local";

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": referer,
        "X-Title": "The Summit Journey",
      },
      signal: options.signal ?? AbortSignal.timeout(25_000),
      body: JSON.stringify({
        model,
        messages: options.messages,
        max_tokens: options.maxTokens ?? 256,
        temperature: options.temperature ?? 0.7,
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[openrouter] fetch thất bại (mạng / timeout / TLS):", msg);
    return null;
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error(
      "[openrouter] chat/completions HTTP",
      res.status,
      errBody ? errBody.slice(0, 800) : "(no body)",
    );
    return null;
  }

  let data: OpenRouterResponse & { error?: { message?: string } };
  try {
    data = (await res.json()) as typeof data;
  } catch (e) {
    console.error("[openrouter] JSON body parse thất bại:", e);
    return null;
  }

  if (data.error?.message) {
    console.error("[openrouter] API error object:", data.error.message);
    return null;
  }

  const choice0 = data.choices?.[0];
  const rawContent = choice0?.message?.content;
  const text = normalizeMessageContent(rawContent);

  if (text.length === 0) {
    console.error(
      "[openrouter] choices[0].message.content rỗng hoặc không đọc được. Có choices:",
      Array.isArray(data.choices) ? data.choices.length : 0,
      "raw typeof content:",
      rawContent === undefined ? "undefined" : typeof rawContent,
      rawContent !== undefined && rawContent !== null && typeof rawContent === "object"
        ? JSON.stringify(rawContent).slice(0, 400)
        : "",
    );
    return null;
  }

  return text;
}

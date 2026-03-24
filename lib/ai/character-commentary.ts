import { openRouterChatCompletion } from "@/lib/ai/openrouter";
import type { PlayerStats } from "@/lib/game/player-stats";

const MAX_LEN = 600;

function safeSnippet(name: string): string {
  return name.replace(/[\u0000-\u001F"\\]/g, " ").trim().slice(0, 64);
}

/**
 * Nhận xét ngắn về nhân vật mới (sau khi đã có tên + chỉ số). `null` nếu không cấu hình AI hoặc gọi thất bại.
 */
export async function generateCharacterCommentary(input: {
  playerName: string;
  stats: PlayerStats;
}): Promise<string | null> {
  const displayName = safeSnippet(input.playerName) || "Vô danh";

  const system =
    "Bạn là người kể chuyện game tu tiên (The Summit Journey). Viết nhận xét ngắn theo phong cách tiên hiệp Việt Nam (Hán Việt nhẹ), không spoil cốt truyện, không ra lệnh cho người chơi, không markdown, không danh sách. Đúng 2 đến 4 câu.";

  const user = `Nhân vật mới xuất phát:
Danh hiệu: ${displayName}
Tu vi: ${input.stats.tu_vi}
Karma: ${input.stats.karma}
Luck: ${input.stats.luck}
Thể lực: ${input.stats.physical}

Hãy nhận xét căn cốt và khởi điểm như lời quan sát của lão tu hoặc thiên cơ — gợi tính cách và hướng đi, không lặp lại dạng bảng số liệu.`;

  const text = await openRouterChatCompletion({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    maxTokens: 320,
    temperature: 0.75,
  });

  if (!text) return null;
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= MAX_LEN) return collapsed;
  return `${collapsed.slice(0, MAX_LEN - 1).trimEnd()}…`;
}

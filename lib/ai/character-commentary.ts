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
  const { tu_vi, karma, luck, physical } = input.stats;

  const system = `Bạn là tiếng nói của một lão tu / thiên cơ trong game tu tiên "The Summit Journey".
Giọng: trêu chọc, châm chọc nhẹ, mỉa mai dí dỏm như bạn bè cùng đạo — tuyệt đối KHÔNG chửi thề, KHÔNG hạ nhục, KHÔNG trách móc nặng, KHÔNG lên án đạo đức kiểu giáo điều.
Viết tiếng Việt, Hán Việt vừa phải; có dấu cách đúng chỗ giữa các từ; 2–4 câu hoàn chỉnh (mỗi câu kết bằng dấu câu), không cắt nửa chừng; không markdown, không gạch đầu dòng.
Tuyệt đối không chèn từ kỹ thuật kiểu tu_vi, snake_case — nếu cần nói chỉ số hãy dùng từ tự nhiên (Tu vi, thể lực, karma, vận may…).
Quy tắc nội dung:
- Chỉ số nào tương đối cao (so với các chỉ số còn lại của cùng nhân vật): khen thật, cụ thể (vd. thể lực cao → khen dẻo dai, chịu đựng; luck cao → khen duyên; tu_vi cao → khen mầm căn cốt).
- Chỉ số thấp / yếu: chỉ được trêu nhẹ bằng ẩn dụ vui (vd. "bẻ cành mà cành chẳng gãy" — ý còn non hoặc chưa cứng), không công kích cá nhân.
- Nếu karma âm: thêm chất châm chọc gợi "tố chất tu ma", "lòng dạ chưa trong", "mầm ám" — luôn giữ ý như trêu chọc chứ không phỉ báng.
- Nếu karma không âm: bớt giọng "ma", vẫn có thể trêu nhẹ.
Không spoil cốt truyện; không ra lệnh cho người chơi.`;

  const user = `Nhân vật mới — danh hiệu: ${displayName}
Chỉ số khởi điểm (chỉ để ngầm hiểu, đừng đọc số ra lại):
tu_vi=${tu_vi}, karma=${karma}, luck=${luck}, physical=${physical}

Viết một đoạn nhận xét như lão tu vừa soi qua căn cốt: trộn khen (chỗ mạnh) với trêu chọc (chỗ yếu hoặc karma âm nếu có), đúng tinh thần trên.`;

  const text = await openRouterChatCompletion({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    maxTokens: 768,
    temperature: 0.82,
    signal: AbortSignal.timeout(55_000),
  });

  if (!text) return null;
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= MAX_LEN) return collapsed;
  return `${collapsed.slice(0, MAX_LEN - 1).trimEnd()}…`;
}

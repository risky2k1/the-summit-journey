type ChoiceLike = { next_event_id: number | null };

/** Giải thích vì sao đôi khi cốt truyện “giống nhau” nhưng vẫn khác gameplay. */
export function describeBranching(
  choices: ChoiceLike[],
  eventType: string,
): string | null {
  if (choices.length < 2) return null;
  const targets = choices.map((c) => c.next_event_id);
  const first = targets[0];
  const allSame = targets.every((t) => t === first);

  if (allSame) {
    if (first == null) {
      if (eventType === "ending") {
        return "Hai lối đều khép chặng — khác nhau ở chỉ số cuối và cách ngươi khép lại trong lòng.";
      }
      return "Không gán sẵn màn tiếp — sau khi cộng chỉ số, trời có thể đưa ngươi sang sự kiện khác nhau theo karma.";
    }
    return `Các lựa chọn đều dẫn tới cùng sự kiện #${first} — **cốt truyện chung**, khác nhau ở **căn cốt** (và sau này có thể tách nhánh theo karma).`;
  }

  const uniq = [...new Set(targets)].filter((x): x is number => x != null);
  if (uniq.length === 0) return null;
  return `Các lối tách **nhánh khác nhau** (sự kiện ${uniq.map((id) => `#${id}`).join(" · ")}). Cốt truyện sẽ khác đoạn sau.`;
}

export function describeChoiceDestination(
  choice: ChoiceLike,
  eventType: string,
): string {
  if (choice.next_event_id != null) {
    return `Tiếp theo: sự kiện #${choice.next_event_id}`;
  }
  if (eventType === "ending") {
    return "Kết chặng — không còn màn gán sẵn.";
  }
  return "Màn kế do trời định theo karma (sau khi cộng chỉ số), không gán sẵn id.";
}

# Game Engine Logic

## handleChoice Flow

1. Lấy run hiện tại
2. Lấy choice
3. Check conditions
4. Apply effects
5. Xác định next_event
6. Update run
7. Save history

## Pseudo Code

function handleChoice(runId, choiceId):
    run = getRun(runId)
    choice = getChoice(choiceId)

    if not passConditions(run.stats, choice.conditions):
        throw error

    run.stats = applyEffects(run.stats, choice.effects)

    if choice.next_event_id exists:
        next_event = choice.next_event_id
    else:
        next_event = findNextEvent(run.stats)

    updateRun(runId, next_event, run.stats)
    logHistory(runId, choiceId)

    return next_event

## findNextEvent Strategy

- Ưu tiên theo karma:
  - karma < -20 → ma_dao
  - karma > 20 → chinh_dao
- fallback → random event
- Trong pool ứng viên: chọn **có trọng số** theo `events.pick_weight` (mặc định 1), không phải uniform.

## Nhánh nội dung (DB)

- Hai lựa chọn có `next_event_id` **khác nhau** → cốt truyện tách thật (ví dụ chương mở: tại event 2, lối thung lũng tới thẳng event 4, bỏ qua event 3).
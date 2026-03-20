"use client";

import { useActionState } from "react";
import {
  createChoice,
  createChoiceEffectAction,
  deleteChoice,
  deleteChoiceEffect,
  deleteEvent,
  updateChoiceAction,
  updateEventAction,
} from "@/app/game-admin/actions";

type Effect = { id: number; stat: string; value: number };
type Choice = {
  id: number;
  content: string;
  weight: number;
  nextEventId: number | null;
  effects: Effect[];
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-amber-800/40 focus:ring-2 focus:ring-amber-800/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50";

const labelClass = "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";

export function EventDetailClient({
  event,
  eventTypeOptions,
  playerStatOptions,
}: {
  event: {
    id: number;
    title: string;
    description: string;
    type: string;
    isActive: boolean;
    choicesFromHere: Choice[];
  };
  eventTypeOptions: readonly string[];
  playerStatOptions: readonly string[];
}) {
  const [eventError, eventAction] = useActionState(updateEventAction, undefined);

  return (
    <div className="space-y-10">
      <form action={eventAction} className="space-y-4">
        <input type="hidden" name="id" value={event.id} />
        {eventError ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {eventError}
          </p>
        ) : null}
        <div>
          <label className={labelClass} htmlFor="ev-title">
            Tiêu đề
          </label>
          <input
            id="ev-title"
            name="title"
            defaultValue={event.title}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ev-desc">
            Mô tả
          </label>
          <textarea
            id="ev-desc"
            name="description"
            rows={5}
            defaultValue={event.description}
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="ev-type">
              Loại (type)
            </label>
            <select
              id="ev-type"
              name="type"
              defaultValue={event.type}
              className={inputClass}
            >
              {eventTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={event.isActive}
                className="rounded border-zinc-400"
              />
              Đang kích hoạt (is_active)
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-amber-900/25 bg-amber-950/[0.06] px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-amber-950/10 dark:border-amber-200/15 dark:bg-amber-100/[0.06] dark:text-zinc-100"
        >
          Lưu event
        </button>
      </form>

      <section className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Lựa chọn (choices)
          </h3>
          <form action={createChoice}>
            <input type="hidden" name="event_id" value={event.id} />
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              + Thêm choice
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-8">
          {event.choicesFromHere.map((c) => (
            <ChoiceBlock
              key={c.id}
              choice={c}
              playerStatOptions={playerStatOptions}
            />
          ))}
        </div>
      </section>

      <form
        action={deleteEvent}
        className="border-t border-red-200 pt-8 dark:border-red-900/40"
        onSubmit={(e) => {
          if (
            !confirm(
              "Xóa hẳn event này và mọi choice liên quan? Hành động không hoàn tác.",
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={event.id} />
        <button
          type="submit"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70"
        >
          Xóa event
        </button>
      </form>
    </div>
  );
}

function ChoiceBlock({
  choice,
  playerStatOptions,
}: {
  choice: Choice;
  playerStatOptions: readonly string[];
}) {
  const [choiceError, choiceAction] = useActionState(updateChoiceAction, undefined);
  const [effectError, effectAction] = useActionState(
    createChoiceEffectAction,
    undefined,
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-900/30">
      <form action={choiceAction} className="space-y-3">
        <input type="hidden" name="id" value={choice.id} />
        {choiceError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{choiceError}</p>
        ) : null}
        <div>
          <label className={labelClass}>Nội dung choice</label>
          <textarea
            name="content"
            rows={3}
            defaultValue={choice.content}
            required
            className={inputClass}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>next_event_id (để trống = null)</label>
            <input
              name="next_event_id"
              type="number"
              min={1}
              defaultValue={choice.nextEventId ?? ""}
              placeholder="—"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>weight</label>
            <input
              name="weight"
              type="number"
              min={1}
              defaultValue={choice.weight}
              required
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-lg border border-amber-900/20 bg-amber-950/[0.05] px-3 py-1.5 text-sm text-zinc-900 dark:border-amber-200/15 dark:bg-amber-100/[0.05] dark:text-zinc-100"
          >
            Lưu choice
          </button>
        </div>
      </form>

      <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Hiệu ứng stat (choice_effects)
        </p>
        {choice.effects.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {choice.effects.map((ef) => (
              <li
                key={ef.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white/80 px-3 py-2 text-sm dark:bg-zinc-950/50"
              >
                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                  {ef.stat} <span className="text-zinc-500">+</span> {ef.value}
                </span>
                <form action={deleteChoiceEffect}>
                  <input type="hidden" name="id" value={ef.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-600 hover:underline dark:text-red-400"
                  >
                    Xóa
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Chưa có effect.</p>
        )}

        <form action={effectAction} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="choice_id" value={choice.id} />
          {effectError ? (
            <p className="w-full text-sm text-red-600 dark:text-red-400">
              {effectError}
            </p>
          ) : null}
          <div className="min-w-[8rem]">
            <label className={labelClass}>stat</label>
            <select name="stat" className={inputClass} defaultValue={playerStatOptions[0]}>
              {playerStatOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className={labelClass}>value</label>
            <input
              name="value"
              type="number"
              defaultValue={0}
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          >
            + Effect
          </button>
        </form>
      </div>

      <form
        action={deleteChoice}
        className="mt-4"
        onSubmit={(e) => {
          if (!confirm("Xóa choice này và mọi effect?")) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={choice.id} />
        <button
          type="submit"
          className="text-xs text-red-600 hover:underline dark:text-red-400"
        >
          Xóa choice #{choice.id}
        </button>
      </form>
    </div>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EventType, PlayerStat } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

const EVENT_TYPES = new Set(Object.values(EventType));
const PLAYER_STATS = new Set(Object.values(PlayerStat));

function parseId(
  raw: FormDataEntryValue | null,
  label: string,
): { ok: true; id: number } | { ok: false; message: string } {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    return { ok: false, message: `${label} không hợp lệ` };
  }
  return { ok: true, id: n };
}

function parseOptionalInt(
  raw: FormDataEntryValue | null,
): number | null {
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

export async function createEvent() {
  await requireSuperAdmin();
  const e = await prisma.event.create({
    data: {
      title: "Sự kiện mới",
      description: "",
      type: EventType.normal,
      isActive: true,
    },
  });
  revalidatePath("/game-admin/events");
  redirect(`/game-admin/events/${e.id}`);
}

export async function updateEventAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireSuperAdmin();
  const idParsed = parseId(formData.get("id"), "id");
  if (!idParsed.ok) return idParsed.message;
  const id = idParsed.id;

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  const typeRaw = String(formData.get("type") ?? "");
  const isActive = formData.get("is_active") === "on";

  if (!title) return "Tiêu đề không được để trống";
  if (!EVENT_TYPES.has(typeRaw as EventType)) {
    return "Loại event không hợp lệ";
  }

  await prisma.event.update({
    where: { id },
    data: {
      title,
      description,
      type: typeRaw as EventType,
      isActive,
    },
  });
  revalidatePath("/game-admin/events");
  revalidatePath(`/game-admin/events/${id}`);
  return undefined;
}

export async function deleteEvent(formData: FormData) {
  await requireSuperAdmin();
  const idParsed = parseId(formData.get("id"), "id");
  if (!idParsed.ok) redirect("/game-admin/events");
  await prisma.event.delete({ where: { id: idParsed.id } });
  revalidatePath("/game-admin/events");
  redirect("/game-admin/events");
}

export async function createChoice(formData: FormData) {
  await requireSuperAdmin();
  const ev = parseId(formData.get("event_id"), "event_id");
  if (!ev.ok) return;
  await prisma.choice.create({
    data: {
      eventId: ev.id,
      content: "Lựa chọn mới",
      nextEventId: null,
      weight: 1,
    },
  });
  revalidatePath(`/game-admin/events/${ev.id}`);
}

export async function updateChoiceAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireSuperAdmin();
  const idParsed = parseId(formData.get("id"), "id");
  if (!idParsed.ok) return idParsed.message;
  const id = idParsed.id;

  const content = String(formData.get("content") ?? "").trim();
  const weight = Number(formData.get("weight"));
  const nextEventId = parseOptionalInt(formData.get("next_event_id"));

  if (!content) return "Nội dung lựa chọn không được để trống";
  if (!Number.isInteger(weight) || weight < 1) {
    return "Trọng số phải là số nguyên ≥ 1";
  }

  const choice = await prisma.choice.update({
    where: { id },
    data: {
      content,
      weight,
      nextEventId,
    },
  });
  revalidatePath(`/game-admin/events/${choice.eventId}`);
  return undefined;
}

export async function deleteChoice(formData: FormData) {
  await requireSuperAdmin();
  const idParsed = parseId(formData.get("id"), "id");
  if (!idParsed.ok) return;
  const choice = await prisma.choice.delete({ where: { id: idParsed.id } });
  revalidatePath(`/game-admin/events/${choice.eventId}`);
}

export async function createChoiceEffectAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  await requireSuperAdmin();
  const ch = parseId(formData.get("choice_id"), "choice_id");
  if (!ch.ok) return ch.message;

  const statRaw = String(formData.get("stat") ?? "");
  const value = Number(formData.get("value"));

  if (!PLAYER_STATS.has(statRaw as PlayerStat)) {
    return "Stat không hợp lệ";
  }
  if (!Number.isInteger(value)) {
    return "Giá trị phải là số nguyên";
  }

  const choice = await prisma.choice.findUniqueOrThrow({
    where: { id: ch.id },
    select: { eventId: true },
  });

  await prisma.choiceEffect.create({
    data: {
      choiceId: ch.id,
      stat: statRaw as PlayerStat,
      value,
    },
  });
  revalidatePath(`/game-admin/events/${choice.eventId}`);
  return undefined;
}

export async function deleteChoiceEffect(formData: FormData) {
  await requireSuperAdmin();
  const idParsed = parseId(formData.get("id"), "id");
  if (!idParsed.ok) return;
  const row = await prisma.choiceEffect.delete({
    where: { id: idParsed.id },
    include: { choice: { select: { eventId: true } } },
  });
  revalidatePath(`/game-admin/events/${row.choice.eventId}`);
}

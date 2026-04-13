/**
 * /api/notes
 * GET    — List notes (optional date filter)
 * POST   — Create a new note
 * PATCH  — Update an existing note
 * DELETE — Delete a note
 *
 * All queries enforce user_id scoping (IDOR prevention).
 * Uses service-role Supabase client.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withAuth, ok, badRequest, serverError } from "@/lib/utils/api";
import { z } from "zod";



const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (d) => {
      const year = parseInt(d.split("-")[0]);
      const now = new Date().getFullYear();
      return year >= now - 5 && year <= now + 5;
    },
    "Date out of acceptable range"
  );

const createNoteSchema = z.object({
  date:    dateSchema,
  content: z.string().min(1).max(5000).transform((s) => s.trim()),
});

const updateNoteSchema = z.object({
  id:      z.string().uuid(),
  date:    dateSchema,
  content: z.string().min(1).max(5000).transform((s) => s.trim()),
});

/* ── GET /api/notes ── */
export const GET = withAuth(async (request, { userId }) => {
  const supabase = createAdminClient();
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");

  let query = supabase
    .from("user_notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (dateParam) {
    const dateResult = dateSchema.safeParse(dateParam);
    if (!dateResult.success) {
      return badRequest("Invalid date format. Use YYYY-MM-DD.");
    }
    query = query.eq("date", dateResult.data);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[Notes GET]:", error);
    return serverError("Failed to fetch notes");
  }

  return ok({ notes: data ?? [] });
});

/* ── POST /api/notes ── */
export const POST = withAuth(async (request, { userId }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body is required");
  }

  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_error",
        message: "Request validation failed",
        details: parsed.error.issues.map((i) => i.message),
      },
      { status: 422 }
    );
  }

  const { date, content } = parsed.data;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_notes")
    .insert({ user_id: userId, date, content })
    .select()
    .single();

  if (error) {
    console.error("[Notes POST]:", error);
    return serverError("Failed to create note");
  }

  return NextResponse.json({ data: { note: data } }, { status: 201 });
});

/* ── PATCH /api/notes ── */
export const PATCH = withAuth(async (request, { userId }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body is required");
  }

  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_error",
        message: "Request validation failed",
        details: parsed.error.issues.map((i) => i.message),
      },
      { status: 422 }
    );
  }

  const { id, content } = parsed.data;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_notes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    if (error?.code === "PGRST116") {
      return NextResponse.json(
        { error: "not_found", message: "Note not found" },
        { status: 404 }
      );
    }
    console.error("[Notes PATCH]:", error);
    return serverError("Failed to update note");
  }

  return ok({ note: data });
});

/* ── DELETE /api/notes ── */
export const DELETE = withAuth(async (request, { userId }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return badRequest("Note ID is required");
  }

  // Validate UUID format
  const uuidResult = z.string().uuid().safeParse(id);
  if (!uuidResult.success) {
    return badRequest("Invalid note ID format");
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("user_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[Notes DELETE]:", error);
    return serverError("Failed to delete note");
  }

  return ok({ success: true });
});

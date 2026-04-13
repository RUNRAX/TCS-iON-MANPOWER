"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/context/ThemeContext";

interface Note {
  id: string;
  user_id: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/* ── Glass button style builder ── */
function glassBtn(
  bg: string,
  borderColor: string,
  disabled: boolean
): React.CSSProperties {
  return {
    backdropFilter: "blur(32px) saturate(180%)",
    background: bg,
    boxShadow: [
      "inset 0  1.5px 0 rgba(255,255,255,0.16)",
      "inset 0 -1px   0 rgba(0,0,0,0.12)",
      "0 6px 20px -4px rgba(0,0,0,0.32)",
    ].join(", "),
    borderRadius: 12,
    border: `1px solid ${borderColor}`,
    padding: "7px 16px",
    fontSize: 12,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    transition: "transform 0.12s ease, opacity 0.15s ease",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };
}

export function NotesPanel({ selectedDate }: { selectedDate: string }) {
  const { dark } = useTheme();

  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textMain = dark ? "#f0eeff" : "#0f0a2e";
  const textMuted = dark ? "rgba(200,195,240,0.50)" : "rgba(30,20,80,0.44)";

  /* ── Fetch notes when date changes ── */
  const fetchNotes = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    setEditingId(null);
    setDraft("");
    try {
      const res = await fetch(`/api/notes?date=${date}`);
      if (!res.ok) throw new Error("Failed to load notes");
      const json = await res.json();
      setNotes(json?.data?.notes ?? []);
    } catch {
      setError("Failed to load notes");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) fetchNotes(selectedDate);
  }, [selectedDate, fetchNotes]);

  /* ── Create note ── */
  const handleSave = async () => {
    if (!draft.trim() || saving) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, content: draft.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save note");
      const json = await res.json();
      const newNote = json?.data?.note;
      if (newNote) setNotes((prev) => [newNote, ...prev]);
      setDraft("");
    } catch {
      setError("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  /* ── Update note ── */
  const handleUpdate = async (id: string) => {
    if (!editDraft.trim() || editSaving) return;
    setError(null);
    setEditSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, date: selectedDate, content: editDraft.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update note");
      const json = await res.json();
      const updated = json?.data?.note;
      if (updated) {
        setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      }
      setEditingId(null);
      setEditDraft("");
    } catch {
      setError("Failed to update note");
    } finally {
      setEditSaving(false);
    }
  };

  /* ── Delete note ── */
  const handleDelete = async (id: string) => {
    setError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setError("Failed to delete note");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Escape key for cancel ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingId) {
        setEditingId(null);
        setEditDraft("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingId]);

  /* ── Format timestamp ── */
  const formatTime = (note: Note) => {
    const created = new Date(note.created_at);
    const updated = new Date(note.updated_at);
    const isEdited = Math.abs(updated.getTime() - created.getTime()) > 2000;
    const d = isEdited ? updated : created;
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return isEdited ? `Edited ${hh}:${mm}` : `${hh}:${mm}`;
  };

  const cardBg = dark ? "rgba(10,8,24,0.42)" : "rgba(255,255,255,0.52)";
  const cardBorder = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";

  return (
    <div>
      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            marginBottom: 12,
            fontSize: 12,
            fontWeight: 600,
            color: "#fca5a5",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          {error}
        </div>
      )}

      {/* New note textarea */}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value.slice(0, 5000))}
        placeholder="Write a note for this date..."
        rows={4}
        style={{
          width: "100%",
          background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
          border: `1px solid ${dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)"}`,
          borderRadius: 14,
          padding: "10px 12px",
          color: textMain,
          fontSize: 13,
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
          lineHeight: 1.6,
          transition: "border-color 0.2s ease",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "rgba(249,115,22,0.60)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = dark
            ? "rgba(255,255,255,0.14)"
            : "rgba(0,0,0,0.08)";
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 6,
        }}
      >
        <span style={{ fontSize: "0.68rem", color: textMuted }}>
          {draft.length} / 5000 characters
        </span>
        <button
          onClick={handleSave}
          disabled={!draft.trim() || saving}
          style={glassBtn(
            "rgba(249,115,22,0.80)",
            "rgba(251,146,60,0.50)",
            !draft.trim() || saving
          )}
          onMouseEnter={(e) => {
            if (draft.trim() && !saving)
              (e.target as HTMLElement).style.transform = "scale(1.04)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.transform = "scale(1)";
          }}
          onMouseDown={(e) => {
            (e.target as HTMLElement).style.transform = "scale(0.96)";
          }}
          onMouseUp={(e) => {
            (e.target as HTMLElement).style.transform = "scale(1.04)";
          }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "20px 0",
            color: textMuted,
            fontSize: 12,
          }}
        >
          Loading notes…
        </div>
      )}

      {/* Notes list */}
      {!loading && notes.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "20px 0",
            color: textMuted,
            fontSize: 12,
          }}
        >
          No notes for this date yet.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {notes.map((note) => {
          const isEditing = editingId === note.id;
          const isDeleting = deletingId === note.id;

          return (
            <div
              key={note.id}
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 16,
                padding: "12px 14px",
                backdropFilter: "blur(32px) saturate(180%)",
                boxShadow: [
                  "inset 0  1.5px 0 rgba(255,255,255,0.16)",
                  "inset 0 -1px   0 rgba(0,0,0,0.12)",
                  "0 6px 20px -4px rgba(0,0,0,0.32)",
                ].join(", "),
              }}
            >
              {isEditing ? (
                /* ── Edit mode ── */
                <div>
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value.slice(0, 5000))}
                    rows={4}
                    style={{
                      width: "100%",
                      background: dark
                        ? "rgba(255,255,255,0.07)"
                        : "rgba(0,0,0,0.04)",
                      border: `1px solid rgba(249,115,22,0.60)`,
                      borderRadius: 14,
                      padding: "10px 12px",
                      color: textMain,
                      fontSize: 13,
                      resize: "none",
                      outline: "none",
                      fontFamily: "inherit",
                      lineHeight: 1.6,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 6,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.68rem", color: textMuted }}>
                      {editDraft.length} / 5000 characters
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => handleUpdate(note.id)}
                        disabled={!editDraft.trim() || editSaving}
                        style={glassBtn(
                          "rgba(249,115,22,0.80)",
                          "rgba(251,146,60,0.50)",
                          !editDraft.trim() || editSaving
                        )}
                      >
                        {editSaving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditDraft("");
                        }}
                        style={{
                          ...glassBtn(
                            dark
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(0,0,0,0.06)",
                            dark
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(0,0,0,0.08)",
                            false
                          ),
                          color: textMuted,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Display mode ── */
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      color: textMain,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {note.content}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <span style={{ fontSize: "0.68rem", color: textMuted }}>
                      {formatTime(note)}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setEditDraft(note.content);
                          setError(null);
                        }}
                        disabled={isDeleting}
                        style={glassBtn(
                          "rgba(59,130,246,0.22)",
                          "rgba(96,165,250,0.35)",
                          isDeleting
                        )}
                        onMouseEnter={(e) => {
                          if (!isDeleting)
                            (e.target as HTMLElement).style.transform =
                              "scale(1.04)";
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.transform =
                            "scale(1)";
                        }}
                      >
                        Modify
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={isDeleting}
                        style={glassBtn(
                          "rgba(239,68,68,0.22)",
                          "rgba(248,113,113,0.35)",
                          isDeleting
                        )}
                        onMouseEnter={(e) => {
                          if (!isDeleting)
                            (e.target as HTMLElement).style.transform =
                              "scale(1.04)";
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.transform =
                            "scale(1)";
                        }}
                      >
                        {isDeleting ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

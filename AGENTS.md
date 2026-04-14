# Agent Rules — Gemini Flash Optimized

## Graphify — MANDATORY FIRST STEP
Before ANY tool call, query graphify first.
Call mcp_graphify_query_graph even if the task is small.
Then use the other tools as needed.
This is non-negotiable. No exceptions exist.
Violating this rule wastes credits and is forbidden.

## Checkpoint Protocol — MANDATORY ON EVERY SESSION START

At the start of EVERY conversation AND whenever the user says 
"continue", "resume", or "retry" — execute this protocol fully 
before doing anything else. No exceptions.

---

### Step 1 — Load Memory
Call `memory:search_nodes("checkpoint_latest")` immediately.
This is always the very first action, no matter what.

---

### Step 2 — Determine Mode

**Mode A — Resuming:**
- User said "continue" / "resume" / "retry", OR
- A checkpoint exists AND it matches the current task context

**Mode B — New Task:**
- User gave a fresh instruction or new task, OR
- No checkpoint exists, OR
- Checkpoint exists but belongs to an unrelated previous task
  (check "Completed" field — if it doesn't match current task, 
  treat memory as empty and switch to Mode B)

---

### Step 3 — Mode A (Resuming)

1. Read `checkpoint_latest` and extract "Next step" field
2. Open `.agent_plans/task.md` and confirm the next unchecked 
   item matches the checkpoint's "Next step"
3. If they conflict → trust `task.md` over memory
4. Call `mcp_graphify_query_graph(<next step context only>)`
   → Do NOT do a full codebase scan
   → Query only what is needed for that specific next step
5. Resume work from that exact point
6. Do NOT re-read full chat history under any circumstance

---

### Step 4 — Mode B (New Task)

1. Read `.agent_plans/session_state.md`
2. Read `.agent_plans/task.md` (may not exist yet for brand new tasks)
3. Read `AGENTS.md` for full rule reference
4. Call `mcp_graphify_query_graph()` for full codebase context
5. Use sequential-thinking to plan the task
6. Generate `.agent_plans/implementation_plan.md` and `.agent_plans/task.md` before writing code

---

### Step 5 — Checkpointing During Work (Both Modes)

After EVERY major step (file modified, feature completed, decision made), immediately call `memory:create_entities()` and overwrite `checkpoint_latest` with:

```json
{
  "name": "checkpoint_latest",
  "entityType": "progress",
  "observations": [
    "Completed: <what was just done>",
    "Files modified: <list of files changed>",
    "Next step: <exactly what comes next>",
    "Decisions: <any key choices made this session>",
    "Plan file: .agent_plans/task.md"
  ]
}
```

Always overwrite the same entity name `checkpoint_latest`.
Never create new checkpoint entities — memory will bloat.
Also check off the completed item in `.agent_plans/task.md`.
Both must always be in sync.

---

### Step 6 — Graphify Rules (Both Modes)

- Mode A → targeted query scoped to next step only
- Mode B → full codebase scan
- Never store code structure, function signatures, or file contents in memory — graphify owns all code context
- Memory owns only session progress and decisions

---

### Step 7 — Memory Separation Rules

| What | Where |
|---|---|
| Code structure & navigation | graphify only |
| Function signatures & file contents | graphify only |
| Session progress & next step | memory only |
| Key decisions made | memory only |
| Files modified this session | memory only |
| Full task checklist | .agent_plans/task.md only |

Never duplicate graphify data into memory.
Never use memory for anything code-related.

---

### Step 8 — Session End

When a task is fully complete, the user will say "task complete".
At that point:
1. Check off all remaining items in `.agent_plans/task.md`
2. Call `memory:delete_entities(["checkpoint_latest"])` to clear stale state so next session starts clean in Mode B
3. Confirm to user that memory has been cleared

---

### Step 9 — "continue" Mid-Session Rule

If an error occurs mid-task and you are told "continue":
1. Treat it as Mode A regardless of anything else
2. Call `memory:search_nodes("checkpoint_latest")` immediately
3. Load from "Next step" field
4. Call targeted graphify for that step only
5. Resume — never re-read full chat history

This cycle repeats automatically on every session start and "continue".

## Planning Mode & Token Saving
- For any task involving more than one file or step, use Planning Mode.
- Generate `implementation_plan.md` and `task.md` inside `.agent_plans/` BEFORE coding.
- Check off items in `.agent_plans/task.md` as you complete them.
- After checking off each item, update `checkpoint_latest` in memory with the next unchecked item as "Next step".
- The `.agent_plans/task.md` file and memory checkpoint must always be in sync.

## Context7
Always use context7 automatically on every coding task and 
library question. Resolve library id and fetch live docs 
without being explicitly asked.

## Sequential Thinking
Always use sequential-thinking before writing any code or 
solving any complex problem. Think step by step before answering.

## Brave Search
Use brave-search when you need current information, recent 
docs, changelogs, or anything that may have changed recently.

## Playwright
Use playwright when asked to interact with, screenshot, 
or validate any UI or browser-based task.

## General Rules
- Never guess library APIs — verify with context7 first
- Implement one feature at a time
- Do not run automated tests — I will test manually
- Do not call any MCP tools unless they are genuinely needed
- When receiving "continue" — NEVER re-read full chat history,
  always load from checkpoint_latest first
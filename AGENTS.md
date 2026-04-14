# Agent Rules — Gemini Flash Optimized

## Graphify — MANDATORY FIRST STEP
Before ANY tool call, query graphify first.
Call mcp_graphify_query_graph even if the task is small.
Then use the other tools as needed.
This is non-negotiable. No exceptions exist.
Violating this rule wastes credits and is forbidden.

## Checkpoint Protocol — MANDATORY ON EVERY SESSION START
This is the FIRST thing you do before anything else, including graphify.

**On every new message or "continue":**
1. Call memory:search_nodes("checkpoint") immediately
2. If a checkpoint exists → read it and resume from "Next Step" field
3. If no checkpoint exists → proceed normally, then create one after first major step

**Checkpoint save format — call memory:create_entities() after every major step:**
```json
{
  "name": "checkpoint_latest",
  "entityType": "progress",
  "observations": [
    "Completed: <what was just done>",
    "Files modified: <list of files changed this session>",
    "Next step: <exactly what to do next>",
    "Decisions: <any key decisions made>",
    "Plan file: .agent_plans/task.md"
  ]
}
```

**Always overwrite the same entity name `checkpoint_latest`** — do not create
new checkpoint entities every time or memory will bloat.

**Memory is ONLY for session progress. Never store:**
- Code structure (graphify handles this)
- Function signatures (graphify handles this)  
- File contents (graphify handles this)

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
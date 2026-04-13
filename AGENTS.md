# Agent Rules — Gemini Flash Optimized

## Graphify
Always call mcp_graphify_query_graph FIRST before using 
grep_search, view_file, or any file reading tool. No exceptions.
Use graphify to identify affected files, then read only those files.
The graph is at graphify-out/GRAPH_REPORT.md for overview and
graphify-out/graph.json for deep queries.

## Context7
Always use context7 automatically on every coding task and 
library question. Resolve library id and fetch live docs 
without being explicitly asked.

## Sequential Thinking
Always use sequential-thinking before writing any code or 
solving any complex problem. Think step by step before answering.

## Memory
Use memory tools to store important project decisions, 
patterns, and working code snippets across sessions.

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
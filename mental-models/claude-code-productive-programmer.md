# Mental Model

```json
{
  "title": "Claude Code Productive Programmer",
  "summary": "Claude Code is a CLI-first AI coding agent with multiple working environments, context-shaping tools, and productivity patterns that compound when used together — the key is knowing which lever to pull when.",
  "concepts": [
    {
      "name": "Working Environments",
      "type": "concept",
      "description": "Claude Code runs in four surfaces — CLI terminal, IDE extensions (VS Code/JetBrains), Desktop app, and Web app (claude.ai/code) — each sharing the same agent core but optimized for different workflows",
      "children": [
        {
          "name": "CLI Terminal",
          "type": "process",
          "description": "The primary power interface — run `claude` to enter interactive mode or `claude -p 'task'` for one-shot automation; supports piping stdin for script integration"
        },
        {
          "name": "IDE Extensions",
          "type": "process",
          "description": "VS Code and JetBrains plugins embed Claude Code inline with your editor — lets Claude see your open files and diagnostics without you manually providing paths"
        },
        {
          "name": "Web and Desktop App",
          "type": "process",
          "description": "claude.ai/code and the Desktop app offer the same agent in a GUI shell — useful when you want a chat-style interface or are not in a terminal context"
        }
      ]
    },
    {
      "name": "Context Shaping",
      "type": "concept",
      "description": "Claude only knows what is in its context window — CLAUDE.md files, memory, and explicit file reads are the levers that determine how well Claude understands your project",
      "children": [
        {
          "name": "CLAUDE.md",
          "type": "process",
          "description": "A markdown file at repo root (or subdirectory) that Claude reads automatically — encode project conventions, architecture decisions, test commands, and off-limits patterns here; this is the highest-leverage setup investment"
        },
        {
          "name": "Memory System",
          "type": "process",
          "description": "Claude Code persists a MEMORY.md index and typed memory files across sessions — saves user preferences, project facts, and feedback so you never re-explain the same context"
        },
        {
          "name": "@ File References",
          "type": "process",
          "description": "Type @filename in your prompt to inject a specific file into context — faster than asking Claude to find it and ensures the right version is read"
        },
        {
          "name": "Conversation Compression",
          "type": "process",
          "description": "Claude automatically summarizes older messages as context fills — for long sessions, /clear resets cleanly; for very long tasks, use subagents to protect the main context"
        }
      ]
    },
    {
      "name": "Permission and Safety Model",
      "type": "concept",
      "description": "Claude operates in a tiered permission system — tool calls that affect shared state or are hard to reverse require explicit approval; understanding tiers prevents both over-blocking and accidental destructive actions",
      "children": [
        {
          "name": "Permission Modes",
          "type": "process",
          "description": "Three modes: default (approve risky actions), auto-approve (all tools allowed), and restricted (read-only) — set per session or persist in settings.local.json via /update-config"
        },
        {
          "name": "Hooks",
          "type": "process",
          "description": "Shell commands wired to Claude Code events (pre-tool, post-tool, on-stop) in settings.json — the harness executes these automatically, not Claude; use for linting, test runs, notifications"
        },
        {
          "name": "settings.json vs settings.local.json",
          "type": "process",
          "description": "Global settings live in ~/.claude/settings.json; project-local overrides in .claude/settings.local.json — commit the project file to share team-wide tool permissions and hooks"
        }
      ]
    },
    {
      "name": "Productivity Patterns",
      "type": "concept",
      "description": "The highest-leverage behaviors that separate a productive Claude programmer from one who fights the tool — prompt discipline, plan mode, and agent delegation are the big three",
      "children": [
        {
          "name": "Plan Mode",
          "type": "process",
          "description": "Enter /plan before a complex task — Claude proposes an approach without executing it, letting you align on strategy before any file is touched; prevents costly misdirected work"
        },
        {
          "name": "Parallel Tool Calls",
          "type": "process",
          "description": "Claude batches independent tool calls in one round-trip — asking for multiple files or searches at once is dramatically faster than sequential prompts; structure requests to enable this"
        },
        {
          "name": "Subagent Delegation",
          "type": "process",
          "description": "The Agent tool spawns specialized subagents (Explore, Plan, codebase-explainer) for isolated research or heavy context tasks — keeps the main conversation focused and prevents context bloat"
        },
        {
          "name": "Slash Commands and Skills",
          "type": "process",
          "description": "Built-in slash commands (/commit, /review-pr, /clear, /help) and user-defined skills provide repeatable workflows — invoke with the Skill tool or type directly in the CLI prompt"
        },
        {
          "name": "! Shell Passthrough",
          "type": "process",
          "description": "Prefix any command with ! in the CLI to run it as a shell command — output lands directly in the conversation, useful for interactive auth flows (e.g. `! gcloud auth login`) or piping context"
        }
      ]
    },
    {
      "name": "Task and Iteration Management",
      "type": "concept",
      "description": "For multi-step work, Claude uses tasks to track progress and plan files to align on approach — combining these with git discipline keeps long sessions recoverable",
      "children": [
        {
          "name": "TaskCreate and TaskUpdate",
          "type": "process",
          "description": "Claude breaks work into discrete tasks with status tracking — you can see real-time progress and Claude marks tasks complete immediately upon finishing each step"
        },
        {
          "name": "Worktree Isolation",
          "type": "process",
          "description": "Agents launched with isolation=worktree get a temporary git worktree — changes are sandboxed and the branch is cleaned up automatically if nothing was modified; safe for exploratory refactors"
        },
        {
          "name": "Commit Discipline",
          "type": "process",
          "description": "Always commit (never amend published history, never skip hooks) — Claude creates new commits after hook fixes rather than amending; ask explicitly to commit, Claude will not do so proactively"
        }
      ]
    }
  ],
  "relationships": [
    { "from": "Working Environments", "to": "Context Shaping", "label": "shapes input to" },
    { "from": "CLAUDE.md", "to": "Productivity Patterns", "label": "grounds" },
    { "from": "Memory System", "to": "Context Shaping", "label": "persists across sessions into" },
    { "from": "Permission and Safety Model", "to": "Hooks", "label": "enforced through" },
    { "from": "Plan Mode", "to": "Task and Iteration Management", "label": "precedes" },
    { "from": "Subagent Delegation", "to": "Worktree Isolation", "label": "optionally uses" },
    { "from": "Parallel Tool Calls", "to": "Productivity Patterns", "label": "accelerates" },
    { "from": "settings.json vs settings.local.json", "to": "Permission Modes", "label": "configures" }
  ],
  "analogies": [
    {
      "concept": "CLAUDE.md",
      "analogy": "An onboarding doc for a new engineer",
      "explanation": "Just as you hand a new hire a document covering team conventions, architecture decisions, and what not to touch — CLAUDE.md does the same for Claude. Without it, Claude asks questions you've answered a hundred times. With it, Claude starts productive from prompt one."
    },
    {
      "concept": "Plan Mode",
      "analogy": "An architect reviewing blueprints before breaking ground",
      "explanation": "A contractor who skips blueprints and starts building makes expensive mistakes. Plan mode is Claude reviewing blueprints with you — the cost of misalignment on paper is nearly zero; the cost after code is written is not."
    },
    {
      "concept": "Subagent Delegation",
      "analogy": "Sending a junior engineer to do research",
      "explanation": "Rather than cluttering your main conversation (the senior engineer's focus) with massive search results, you delegate to a subagent. It returns a clean summary — the context stays focused and the main task stays on track."
    },
    {
      "concept": "Permission Modes",
      "analogy": "sudo vs. a read-only user account",
      "explanation": "Default mode is like a standard user account — you approve actions before they hit shared systems. Auto-approve is sudo. Restricted is read-only. Match the mode to the risk of what you're doing, not to convenience."
    }
  ]
}
```
# Mental Model

```json
{
  "title": "Claude Code GitHub Integration",
  "summary": "Claude Code integrates with GitHub through Actions and a managed Code Review service, enabling AI-driven automation for PRs, issues, and CI/CD workflows.",
  "concepts": [
    {
      "name": "GitHub Actions Integration",
      "type": "Concept",
      "description": "A GitHub Action (anthropics/claude-code-action) that lets Claude respond to any GitHub event and take automated actions in your repo",
      "children": [
        {
          "name": "@claude Mentions",
          "type": "Process",
          "description": "Trigger Claude by mentioning @claude in PR or issue comments to implement features, fix bugs, or answer questions",
          "children": []
        },
        {
          "name": "Event Triggers",
          "type": "Process",
          "description": "Bind Claude to any GitHub event: issue opened, PR pushed, scheduled cron, review comment, etc.",
          "children": []
        },
        {
          "name": "ANTHROPIC_API_KEY Secret",
          "type": "Process",
          "description": "Store your API key as a GitHub repo secret; Claude uses it to authenticate and run tasks",
          "children": []
        }
      ]
    },
    {
      "name": "Code Review Service",
      "type": "Concept",
      "description": "A managed background service that auto-analyzes every PR diff in context of the full codebase and posts inline review comments",
      "children": [
        {
          "name": "Inline Comments",
          "type": "Process",
          "description": "Claude posts findings as inline PR comments on specific lines, ranked by severity (bug, nit, pre-existing)",
          "children": []
        },
        {
          "name": "CLAUDE.md / REVIEW.md",
          "type": "Process",
          "description": "Config files that tell Claude what to flag, what style rules to enforce, and what to skip during reviews",
          "children": []
        },
        {
          "name": "Manual Trigger",
          "type": "Process",
          "description": "Comment '@claude review' on any PR to trigger an on-demand review",
          "children": []
        }
      ]
    },
    {
      "name": "GitHub App",
      "type": "Concept",
      "description": "The Claude GitHub App grants permissions to read/write PRs, issues, and files — required for both Actions and Code Review",
      "children": []
    },
    {
      "name": "Cloud Provider Auth",
      "type": "Concept",
      "description": "Claude Actions can authenticate via AWS Bedrock, Google Vertex AI, or Azure using OIDC instead of a direct API key",
      "children": []
    }
  ],
  "relationships": [
    {
      "from": "GitHub Actions Integration",
      "to": "@claude Mentions",
      "label": "triggered by"
    },
    {
      "from": "GitHub Actions Integration",
      "to": "Event Triggers",
      "label": "bound to"
    },
    {
      "from": "GitHub Actions Integration",
      "to": "ANTHROPIC_API_KEY Secret",
      "label": "authenticates via"
    },
    {
      "from": "Code Review Service",
      "to": "Inline Comments",
      "label": "outputs"
    },
    {
      "from": "Code Review Service",
      "to": "CLAUDE.md / REVIEW.md",
      "label": "configured by"
    },
    {
      "from": "Code Review Service",
      "to": "Manual Trigger",
      "label": "triggered by"
    },
    {
      "from": "GitHub App",
      "to": "GitHub Actions Integration",
      "label": "enables"
    },
    {
      "from": "GitHub App",
      "to": "Code Review Service",
      "label": "enables"
    },
    {
      "from": "Cloud Provider Auth",
      "to": "GitHub Actions Integration",
      "label": "alternative auth for"
    }
  ],
  "analogies": [
    {
      "concept": "GitHub Actions Integration",
      "analogy": "A smart on-call engineer",
      "explanation": "Just like an on-call engineer wakes up when paged, Claude wakes up when triggered by a GitHub event — reads the context, takes action, and posts results — then goes back to sleep."
    },
    {
      "concept": "Code Review Service",
      "analogy": "An always-on pair reviewer",
      "explanation": "Like a senior engineer who automatically reviews every PR you open, the Code Review service silently analyzes each diff and leaves targeted feedback — without you ever having to ask."
    },
    {
      "concept": "CLAUDE.md / REVIEW.md",
      "analogy": "A team style guide handed to a new hire",
      "explanation": "Just as you hand a new engineer a style guide so they know what the team cares about, CLAUDE.md and REVIEW.md tell Claude what rules matter in your project so it gives relevant, project-aware feedback."
    }
  ]
}
```
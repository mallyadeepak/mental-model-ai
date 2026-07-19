import type { PlaybookCard } from '../types.js';

export const playbookCards: PlaybookCard[] = [
  {
    id: 'ground-in-my-docs',
    prompt: 'The model needs to always answer from my company’s docs, not its training data.',
    recommendation: 'Retrieval-Augmented Generation (RAG)',
    rationale:
      'Facts that change or need to be cited belong in a retrieval system you control, not baked into weights. Start with a solid chunking + hybrid search pipeline before reaching for anything fancier.',
    links: [
      { label: 'RAG pillar', topicId: 'rag' },
      { label: 'RAG Pipeline in Depth', topicId: 'rag_pipeline' },
    ],
  },
  {
    id: 'take-actions',
    prompt: 'The model needs to take real actions — send an email, query a database, update a record.',
    recommendation: 'Tool Use, wrapped in an Agent Loop',
    rationale:
      'Define narrow, well-described tools for each action, then wrap the model in a perceive-reason-act-observe loop so it can call them, read results, and decide what to do next.',
    links: [
      { label: 'Tool Use & Function Calling', topicId: 'tool_use' },
      { label: 'Agents & Agentic Loops', topicId: 'agents' },
      { label: 'Tool Contract Anatomy', topicId: 'tool_contract' },
    ],
  },
  {
    id: 'multiple-roles',
    prompt: 'The task naturally splits into multiple specialized roles — research, writing, review.',
    recommendation: 'Multi-Agent System with an Orchestrator',
    rationale:
      'Give each role its own agent, context, and tools, and put one orchestrator in charge of delegating and synthesizing the final answer. Don’t split roles just for the sake of it — confirm one agent genuinely can’t hold it all.',
    links: [
      { label: 'Multi-Agent Systems', topicId: 'multi_agent' },
      { label: 'Orchestration Patterns', topicId: 'orchestration_patterns' },
    ],
  },
  {
    id: 'guaranteed-json',
    prompt: 'A downstream program needs to parse the output — it must always be valid JSON.',
    recommendation: 'Structured Output / Forced Schema',
    rationale:
      'Never regex free text. Use the provider’s structured output mode or model the response as a tool call with a strict schema, and validate before it reaches your program.',
    links: [
      { label: 'Prompt & Context Engineering', topicId: 'prompting' },
      { label: 'Tool Use & Function Calling', topicId: 'tool_use' },
    ],
  },
  {
    id: 'trust-before-ship',
    prompt: 'I need to know this actually works before I ship a change to the prompt or model.',
    recommendation: 'A Golden-Dataset Eval Suite, Gated in CI',
    rationale:
      'Build a small set of real inputs with expected properties, score every change against it — rule-based where possible, LLM-as-judge where it must be subjective — and block merges on regression.',
    links: [
      { label: 'Evaluation & Observability', topicId: 'evaluation' },
    ],
  },
  {
    id: 'choosing-framework',
    prompt: 'I’m deciding between LangGraph, CrewAI, AutoGen, and the vendor Agent SDKs.',
    recommendation: 'Match the framework to the specific hard problem, not the hype',
    rationale:
      'Explicit state control, fast role-based teams, emergent multi-agent chat, and tight vendor integration are different problems — and a single well-built agent often needs no framework at all yet.',
    links: [
      { label: 'Frameworks & Protocols', topicId: 'frameworks' },
      { label: 'Choosing an Agent Framework', topicId: 'framework_comparison' },
    ],
  },
  {
    id: 'remember-past-sessions',
    prompt: 'The agent needs to remember a user or past sessions, not just the current conversation.',
    recommendation: 'Long-Term / Episodic Memory (RAG over past interactions)',
    rationale:
      'Store summarized past sessions and retrieve the relevant ones at query time — the same chunking and retrieval-quality principles from RAG apply directly to "memory".',
    links: [
      { label: 'Memory & State', topicId: 'memory' },
    ],
  },
  {
    id: 'reduce-cost-latency',
    prompt: 'Costs or latency are too high, and most requests are actually pretty easy.',
    recommendation: 'Model Routing + Caching',
    rationale:
      'Classify request difficulty cheaply, route easy requests to a small/fast model, cache aggressively (exact, semantic, and provider-side prompt caching), and stream by default.',
    links: [
      { label: 'Production Architecture & Safety', topicId: 'production' },
    ],
  },
  {
    id: 'single-vs-multi',
    prompt: 'I can’t tell if I actually need multiple agents, or if I’m over-engineering.',
    recommendation: 'Default to one agent with more tools; add agents only for specialization or parallelism',
    rationale:
      'Add a second agent when one context genuinely can’t hold the needed expertise at once, or when independent subtasks can run concurrently. Otherwise it’s coordination overhead with no benefit.',
    links: [
      { label: 'Agents & Agentic Loops', topicId: 'agents' },
      { label: 'Multi-Agent Systems', topicId: 'multi_agent' },
    ],
  },
  {
    id: 'contain-mistakes',
    prompt: 'I’m worried about the agent doing something wrong or destructive.',
    recommendation: 'Layered Guardrails + Human Approval Gates',
    rationale:
      'Assume it will eventually try the wrong thing. Filter input, sandbox tool execution with least privilege, validate output, and require explicit approval before anything irreversible.',
    links: [
      { label: 'Production Architecture & Safety', topicId: 'production' },
      { label: 'Layered Guardrail Architecture', topicId: 'guardrails' },
    ],
  },
];

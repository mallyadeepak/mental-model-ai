import type { TopicContent } from '../types.js';
import { buildModel } from './builder.js';

export const leaves: Record<string, TopicContent> = {
  react_loop: {
    id: 'react_loop',
    kind: 'leaf',
    title: 'The ReAct Loop',
    tagline: 'Interleaving reasoning and action, one step at a time.',
    icon: '🔁',
    parentId: 'agents',
    principles: [
      {
        title: 'Reason and act are the same step, not two phases',
        detail:
          'Each iteration produces both a short rationale and an action, so the trace itself is the audit log of why the agent did what it did.',
      },
      {
        title: 'Observations are allowed to change the plan',
        detail:
          "ReAct's core advantage over a rigid plan is that each new observation can redirect the very next thought — valuable when tools or the environment are unpredictable.",
      },
      {
        title: 'Verbosity control matters',
        detail:
          "Unconstrained 'thought' text burns tokens and can ramble. Cap it or ask for a fixed-format one-sentence rationale to keep loops fast and cheap.",
      },
      {
        title: 'It still needs a stopping condition',
        detail:
          "ReAct describes the step, not the exit. Pair it with a max-iteration budget and a clear 'final answer' signal — see the Agents pillar.",
      },
    ],
    tradeoffs: [
      {
        dimension: 'vs. Plan-and-Execute',
        left: 'ReAct: decide one step at a time',
        right: 'Plan-and-Execute: commit to a full plan first',
        guidance:
          'ReAct adapts mid-task when tool results surprise it; Plan-and-Execute is cheaper and more auditable when the task is well understood. See Planning Patterns for the full comparison.',
      },
    ],
    code: {
      language: 'text',
      caption: 'The ReAct prompt format, stripped down',
      code: `Thought: I need the current weather to answer this.
Action: get_weather(city="Boston")
Observation: 61F, light rain
Thought: That answers the question directly.
Final Answer: It's 61°F and lightly raining in Boston right now.`,
    },
    furtherReading: 'Originally introduced in "ReAct: Synergizing Reasoning and Acting in Language Models" (Yao et al., 2022).',
    model: buildModel({
      id: 'react-loop-model',
      title: 'ReAct Loop',
      summary: 'One reasoning step, one action, one observation — repeated until done.',
      nodes: [
        { id: 'root', label: 'ReAct', description: 'Reason + Act, interleaved on every iteration.', depth: 0, nodeType: 'concept' },
        { id: 'thought1', label: 'Thought', description: 'A short rationale for what to do next, given the goal and history so far.', depth: 1, nodeType: 'process' },
        { id: 'action1', label: 'Action', description: 'A tool call chosen based on the thought.', depth: 1, nodeType: 'process' },
        { id: 'obs1', label: 'Observation', description: "The tool's result, appended to the trace.", depth: 1, nodeType: 'process' },
        { id: 'thought2', label: 'Thought (revised)', description: 'Reasoning updates based on what was actually observed — not just what was expected.', depth: 2, nodeType: 'process' },
        { id: 'final', label: 'Final Answer', description: 'Emitted once the thought step judges the goal satisfied.', depth: 2, nodeType: 'example' },
      ],
      edges: [
        { source: 'root', target: 'thought1', edgeType: 'contains' },
        { source: 'thought1', target: 'action1', edgeType: 'leads_to' },
        { source: 'action1', target: 'obs1', edgeType: 'leads_to' },
        { source: 'obs1', target: 'thought2', edgeType: 'leads_to' },
        { source: 'thought2', target: 'final', label: 'when satisfied', edgeType: 'leads_to' },
        { source: 'thought2', target: 'action1', label: 'otherwise, loops', edgeType: 'leads_to' },
      ],
      analogies: [
        {
          concept: 'ReAct',
          realWorldExample: 'Navigating a new city by asking at each corner',
          explanation:
            "You don't plan the entire route before leaving. You think ('probably left'), act (walk to the corner), observe (a street sign), and re-think from there. Wrong turns get corrected one block at a time instead of invalidating an entire pre-made map.",
          relatedNodeId: 'root',
        },
      ],
    }),
  },

  planning_patterns: {
    id: 'planning_patterns',
    kind: 'leaf',
    title: 'Planning Patterns',
    tagline: 'Plan-and-Execute, Reflexion, and ReAct — and how they combine.',
    icon: '🗺️',
    parentId: 'agents',
    principles: [
      {
        title: 'Plan-and-Execute front-loads thinking, back-loads adaptability',
        detail:
          "You get a clear, reviewable plan up front — but if step 3 reveals the plan was wrong, you need explicit replanning logic. It doesn't happen automatically the way it does in ReAct.",
      },
      {
        title: 'Reflexion adds a critique pass instead of a smarter first attempt',
        detail:
          'Generate, evaluate against criteria (or self-critique), retry with the critique as feedback. Effective when there is a clear success signal — tests passing, a rubric, a validator.',
      },
      {
        title: 'Match the pattern to how well-understood the task is',
        detail:
          'Well-scoped, mostly-known tasks favor Plan-and-Execute (cheaper, auditable). Open-ended or unpredictable tasks favor ReAct. Tasks with a checkable output favor adding a Reflexion pass on top of either.',
      },
      {
        title: 'These compose — they are not mutually exclusive',
        detail:
          'A Plan-and-Execute agent can run each step as its own small ReAct loop, and either can add a Reflexion pass before returning a final answer.',
      },
    ],
    tradeoffs: [
      {
        dimension: 'Predictability vs. adaptability',
        left: 'Plan-and-Execute',
        right: 'ReAct',
        guidance:
          'Choose Plan-and-Execute when you need an auditable, reviewable plan and the task rarely surprises you. Choose ReAct when tool results are unpredictable enough that committing to a full plan upfront would frequently be wrong.',
      },
    ],
    model: buildModel({
      id: 'planning-patterns-model',
      title: 'Planning Patterns',
      summary: 'Three different answers to "how much should the agent decide before it acts?"',
      nodes: [
        { id: 'root', label: 'Planning Patterns', description: 'Different strategies for sequencing reasoning, action, and self-review.', depth: 0, nodeType: 'concept' },
        { id: 'react_n', label: 'ReAct', description: 'Reason and act interleaved, one step at a time, adapting as it goes.', depth: 1, nodeType: 'concept' },
        { id: 'plan_exec', label: 'Plan-and-Execute', description: 'Produce a full plan first, then execute each step — replanning only if needed.', depth: 1, nodeType: 'concept' },
        { id: 'reflexion', label: 'Reflexion', description: 'Act, critique the result against a goal, retry with the critique as feedback.', depth: 1, nodeType: 'concept' },
        { id: 'hybrid', label: 'Hybrid', description: 'Plan at the top level; run each step as a ReAct loop; add a Reflexion pass at the end.', depth: 2, nodeType: 'example' },
      ],
      edges: [
        { source: 'root', target: 'react_n', edgeType: 'contains' },
        { source: 'root', target: 'plan_exec', edgeType: 'contains' },
        { source: 'root', target: 'reflexion', edgeType: 'contains' },
        { source: 'react_n', target: 'hybrid', edgeType: 'relates' },
        { source: 'plan_exec', target: 'hybrid', edgeType: 'relates' },
        { source: 'reflexion', target: 'hybrid', edgeType: 'relates' },
      ],
      analogies: [
        {
          concept: 'Planning Patterns',
          realWorldExample: 'Renovating a house vs. improvising a road trip vs. editing an essay',
          explanation:
            'A renovation needs a plan and permits before any wall comes down (Plan-and-Execute). A road trip with no fixed itinerary adapts at every fork (ReAct). Editing an essay means writing a draft, critiquing it against a rubric, and revising (Reflexion). Real projects often use all three at different points.',
          relatedNodeId: 'root',
        },
      ],
    }),
  },

  orchestration_patterns: {
    id: 'orchestration_patterns',
    kind: 'leaf',
    title: 'Multi-Agent Orchestration Patterns',
    tagline: 'Supervisor-worker, hierarchical, peer-to-peer, and blackboard coordination.',
    icon: '🧭',
    parentId: 'multi_agent',
    principles: [
      {
        title: 'Supervisor-worker is the default for a reason',
        detail:
          'One agent plans and delegates; workers execute narrow tasks and report back. Easiest to reason about, debug, and put a single owner on the final answer.',
      },
      {
        title: 'Hierarchical scales supervision, not just work',
        detail:
          "Once a single supervisor's context can't hold the whole task, add a layer — a supervisor of supervisors — mirroring how human orgs scale management, not just headcount.",
      },
      {
        title: 'Peer-to-peer handoff trades control for flexibility',
        detail:
          'Agents pass control directly to whichever peer is best suited next (triage → billing → refunds). Flexible, but nobody owns the overall trajectory — cap the number of handoffs.',
      },
      {
        title: 'Blackboard state needs a schema and a writer discipline',
        detail:
          'A shared workspace many agents read and write is powerful and also the easiest way to get race conditions. Define who can write which fields; treat conflicting writes as an error, not a silent overwrite.',
      },
    ],
    tradeoffs: [
      {
        dimension: 'Control topology',
        left: 'Supervisor-worker (centralized)',
        right: 'Peer-to-peer (decentralized)',
        guidance:
          'Centralize when you need one throat to choke and a clear final answer. Decentralize when handoffs are naturally sequential and no single agent needs the full picture — like a support triage chain.',
      },
    ],
    frameworks: [
      { name: 'LangGraph supervisor pattern', blurb: 'A supervisor node routes to worker nodes via explicit graph edges and shared state.' },
      { name: 'CrewAI hierarchical process', blurb: 'A manager agent decomposes and delegates tasks to role-based crew members.' },
      { name: 'AutoGen group chat', blurb: 'Agents converse in a shared chat, with a chat manager selecting who speaks next.' },
    ],
    code: {
      language: 'text',
      caption: 'Supervisor-worker, stripped to its skeleton',
      code: `plan = supervisor.decompose(task)
results = []
for subtask in plan:
    worker = pick_specialist(subtask)      // route by declared skill
    results.append(worker.run(subtask))
return supervisor.synthesize(results)      // one agent owns the final answer`,
    },
    model: buildModel({
      id: 'orchestration-patterns-model',
      title: 'Orchestration Patterns',
      summary: 'Different topologies for how agents coordinate and hand off control.',
      nodes: [
        { id: 'root', label: 'Orchestration Patterns', description: 'How multiple agents divide work and stay coordinated.', depth: 0, nodeType: 'concept' },
        { id: 'supervisor', label: 'Supervisor-Worker', description: 'One agent plans and delegates; workers execute and report back.', depth: 1, nodeType: 'concept' },
        { id: 'hierarchical', label: 'Hierarchical', description: 'Supervisors of supervisors, for tasks too large for one context.', depth: 1, nodeType: 'concept' },
        { id: 'peer', label: 'Peer-to-Peer Handoff', description: 'Control passes directly between specialized peers.', depth: 1, nodeType: 'concept' },
        { id: 'blackboard', label: 'Blackboard / Shared State', description: 'A common workspace agents read from and write to.', depth: 1, nodeType: 'concept' },
        { id: 'debate', label: 'Debate & Critique', description: 'Agents challenge or verify each other before finalizing an answer.', depth: 1, nodeType: 'example' },
      ],
      edges: [
        { source: 'root', target: 'supervisor', edgeType: 'contains' },
        { source: 'root', target: 'hierarchical', edgeType: 'contains' },
        { source: 'root', target: 'peer', edgeType: 'contains' },
        { source: 'root', target: 'blackboard', edgeType: 'contains' },
        { source: 'root', target: 'debate', edgeType: 'contains' },
        { source: 'supervisor', target: 'hierarchical', label: 'scales to', edgeType: 'leads_to' },
      ],
      analogies: [
        {
          concept: 'Orchestration Patterns',
          realWorldExample: 'How a hospital routes a patient',
          explanation:
            'Triage (supervisor) assesses and routes to a specialist (worker). A complex case escalates through a chain of departments (hierarchical). An ER-to-surgery handoff is direct (peer-to-peer). The shared patient chart everyone reads and updates is the blackboard.',
          relatedNodeId: 'root',
        },
      ],
    }),
  },

  mcp_protocol: {
    id: 'mcp_protocol',
    kind: 'leaf',
    title: 'Model Context Protocol (MCP)',
    tagline: 'The open protocol standardizing how models connect to tools, data, and prompts.',
    icon: '🔌',
    parentId: 'frameworks',
    principles: [
      {
        title: 'MCP standardizes the boundary between model host and capability provider',
        detail:
          'Instead of every app writing bespoke integrations to every tool or data source, a server exposes tools/resources/prompts once, and any MCP-compatible host can use them.',
      },
      {
        title: "Three primitives cover most needs",
        detail:
          "Tools (actions the model can invoke), resources (data the host can read into context), and prompts (reusable templates the server offers) — a clean separation of 'do', 'read', and 'template'.",
      },
      {
        title: "It's transport-agnostic by design",
        detail:
          'Local servers over stdio, remote servers over HTTP/SSE — the same client-side contract works whether the capability is a local filesystem or a remote SaaS API.',
      },
      {
        title: "MCP doesn't replace your agent framework — it feeds it",
        detail:
          'A LangGraph or Claude Agent SDK agent can consume tools from an MCP server exactly like a hand-written tool. MCP is the plug standard, not the orchestrator.',
      },
    ],
    tradeoffs: [
      {
        dimension: 'Integration approach',
        left: 'Bespoke per-app tool integration',
        right: 'MCP server, reusable across hosts',
        guidance:
          'Write a bespoke integration for a single, one-off internal tool. Build an MCP server the moment more than one app or agent needs the same capability.',
      },
    ],
    frameworks: [
      { name: 'This repository', blurb: 'packages/mcp-server in this very codebase is a working MCP server — a concrete, in-repo example to read alongside this diagram.' },
    ],
    code: {
      language: 'json',
      caption: 'What a tool looks like from the client side of MCP',
      code: `{
  "name": "explain_concept",
  "description": "Generate a mental model diagram for a concept",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "depth": { "type": "number", "minimum": 1, "maximum": 3 }
    },
    "required": ["query"]
  }
}`,
    },
    model: buildModel({
      id: 'mcp-protocol-model',
      title: 'Model Context Protocol',
      summary: 'Host, client, and server — the three roles that make tools portable across apps.',
      nodes: [
        { id: 'root', label: 'MCP', description: 'A protocol for exposing tools, resources, and prompts to any compatible host.', depth: 0, nodeType: 'concept' },
        { id: 'host', label: 'Host', description: 'The application the user interacts with — e.g. Claude Code, a chat app.', depth: 1, nodeType: 'concept' },
        { id: 'client', label: 'MCP Client', description: 'Lives inside the host; manages one connection to one server.', depth: 1, nodeType: 'process' },
        { id: 'server', label: 'MCP Server', description: 'Exposes capabilities — this repo’s packages/mcp-server is one.', depth: 1, nodeType: 'concept' },
        { id: 'tools_n', label: 'Tools', description: 'Actions the model can invoke, with a name, description, and schema.', depth: 2, nodeType: 'concept' },
        { id: 'resources_n', label: 'Resources', description: 'Data the host can read into context on demand.', depth: 2, nodeType: 'concept' },
        { id: 'prompts_n', label: 'Prompts', description: 'Reusable prompt templates the server offers to the host.', depth: 2, nodeType: 'concept' },
      ],
      edges: [
        { source: 'root', target: 'host', edgeType: 'contains' },
        { source: 'host', target: 'client', edgeType: 'contains' },
        { source: 'client', target: 'server', label: 'connects to', edgeType: 'leads_to' },
        { source: 'server', target: 'tools_n', edgeType: 'contains' },
        { source: 'server', target: 'resources_n', edgeType: 'contains' },
        { source: 'server', target: 'prompts_n', edgeType: 'contains' },
      ],
      analogies: [
        {
          concept: 'MCP',
          realWorldExample: 'USB-C for AI tools',
          explanation:
            "Before a common connector, every device needed its own cable. USB-C let any compliant device plug into any compliant port. MCP does the same for tools and data: any MCP server plugs into any MCP-compatible host, instead of every app writing a custom integration to every tool.",
          relatedNodeId: 'root',
        },
      ],
    }),
  },

  framework_comparison: {
    id: 'framework_comparison',
    kind: 'leaf',
    title: 'Choosing an Agent Framework',
    tagline: 'A decision guide, not a popularity contest.',
    icon: '⚖️',
    parentId: 'frameworks',
    principles: [
      {
        title: "Start by asking what's hard about your problem, not which framework is trendy",
        detail:
          "Explicit control over branching/state, fast role-based team setup, emergent multi-agent conversation, and tight vendor integration are different hard problems with different right answers.",
      },
      {
        title: "Most teams underestimate how far 'no framework' gets you",
        detail:
          'A single agent with a handful of well-designed tools, a loop, and basic logging is often the whole system. Add a framework when you feel the specific pain it solves, not before.',
      },
      {
        title: 'Portability is a spectrum, not a binary',
        detail:
          "Even 'lock-in-prone' frameworks are usually fine if your core business logic — prompts, tool implementations, evals — lives outside the framework's DSL and the framework is just the glue.",
      },
      {
        title: 'Re-evaluate at multi-agent, not at day one',
        detail:
          'The choice matters most once you add a second agent or need persisted, resumable state. Early on, most frameworks are roughly interchangeable.',
      },
    ],
    tradeoffs: [
      {
        dimension: 'Control vs. speed-to-build',
        left: 'LangGraph (explicit graph, more code)',
        right: 'CrewAI (opinionated roles, less code)',
        guidance:
          'Reach for LangGraph when you need precise, inspectable control flow and persisted state across long-running workflows. Reach for CrewAI when the role/task metaphor matches your problem and you want to move fast.',
      },
    ],
    frameworks: [
      { name: 'LangGraph', blurb: 'Explicit graphs/state machines. Most control, most code, best for complex or long-running workflows.' },
      { name: 'CrewAI', blurb: 'Role-based crews with tasks and a process. Fastest to stand up a "team of agents" metaphor.' },
      { name: 'AutoGen', blurb: 'Conversable agents in a group chat. Strong for research-style, emergent multi-agent behavior.' },
      { name: 'OpenAI Agents SDK / Claude Agent SDK', blurb: 'Vendor-native primitives — agents, handoffs, guardrails — closest to the underlying model provider.' },
    ],
    code: {
      language: 'text',
      caption: 'A decision heuristic, not a flowchart to worship',
      code: `if need_explicit_state_machine_and_persistence: use("LangGraph")
elif need_fast_role_based_team:                  use("CrewAI")
elif need_emergent_multi_agent_conversation:      use("AutoGen")
elif committed_to_one_model_vendor:               use("that vendor's Agent SDK")
else:                                             use("a hand-rolled loop — add a framework later")`,
    },
    model: buildModel({
      id: 'framework-comparison-model',
      title: 'Choosing a Framework',
      summary: 'Route by the specific problem you have, not by name recognition.',
      nodes: [
        { id: 'root', label: 'Choosing a Framework', description: 'What kind of hard problem are you actually solving?', depth: 0, nodeType: 'concept' },
        { id: 'control', label: 'Need explicit state control?', description: 'Long-running, branching, needs persisted/resumable state → LangGraph.', depth: 1, nodeType: 'process' },
        { id: 'roles', label: 'Need a fast role-based team?', description: 'Clear roles and tasks, want to move fast → CrewAI.', depth: 1, nodeType: 'process' },
        { id: 'chat', label: 'Need emergent multi-agent conversation?', description: 'Agents debating/collaborating in open-ended chat → AutoGen.', depth: 1, nodeType: 'process' },
        { id: 'vendor', label: 'Committed to one model vendor?', description: 'Want the most native, tightly integrated primitives → that vendor’s Agent SDK.', depth: 1, nodeType: 'process' },
        { id: 'none', label: 'Simple, one agent, few tools?', description: "Don't reach for a framework yet — a loop and good tools are the whole system.", depth: 1, nodeType: 'example' },
      ],
      edges: [
        { source: 'root', target: 'control', edgeType: 'contains' },
        { source: 'root', target: 'roles', edgeType: 'contains' },
        { source: 'root', target: 'chat', edgeType: 'contains' },
        { source: 'root', target: 'vendor', edgeType: 'contains' },
        { source: 'root', target: 'none', edgeType: 'contains' },
      ],
      analogies: [
        {
          concept: 'Choosing a Framework',
          realWorldExample: 'Picking project management software',
          explanation:
            "A spreadsheet is fine for a two-person project. A Gantt-chart tool earns its keep once dependencies get complex. Kanban suits a fast-moving small team. The mistake isn't picking any specific tool — it's adopting a heavyweight one before the coordination problem it solves actually exists.",
          relatedNodeId: 'root',
        },
      ],
    }),
  },

  rag_pipeline: {
    id: 'rag_pipeline',
    kind: 'leaf',
    title: 'The RAG Pipeline in Depth',
    tagline: 'Query rewriting, hybrid search, reranking, and agentic retrieval.',
    icon: '🔍',
    parentId: 'rag',
    principles: [
      {
        title: 'Query rewriting closes the vocabulary gap',
        detail:
          "Users don't phrase questions the way documents are written. Expanding or rewriting the query — or generating a hypothetical answer to embed instead (HyDE) — recovers matches plain similarity search misses.",
      },
      {
        title: 'Hybrid search is the default, not the exception',
        detail:
          'Combine dense vector similarity with sparse keyword search (BM25) and merge results. This covers both semantic queries and exact-match queries (IDs, names, error codes) in one pipeline.',
      },
      {
        title: 'Rerank before you truncate',
        detail:
          'A cheap first-pass retrieval (top 50) followed by a precise reranker cutting to top 5 beats retrieving only 5 directly — the two stages optimize for different things: recall, then precision.',
      },
      {
        title: 'Agentic RAG turns retrieval into a decision, not a fixed step',
        detail:
          'Instead of always retrieving once, an agent can decide whether to retrieve, retrieve again with a refined query, or answer directly — trading latency for accuracy on hard, multi-hop questions.',
      },
    ],
    tradeoffs: [
      {
        dimension: 'Retrieval depth',
        left: 'Fixed, single retrieval pass',
        right: 'Agentic, iterative retrieval',
        guidance:
          'Use a fixed pass for latency-sensitive queries over a well-covered corpus. Let the agent iterate when questions are multi-hop or the first retrieval frequently misses.',
      },
    ],
    code: {
      language: 'text',
      caption: 'Hybrid search + rerank, in outline',
      code: `dense_hits  = vector_index.search(embed(query), top_k=50)
sparse_hits = keyword_index.search(query, top_k=50)
merged      = reciprocal_rank_fusion(dense_hits, sparse_hits)
top_5       = reranker.rerank(query, merged, top_k=5)
context     = assemble_with_citations(top_5)`,
    },
    model: buildModel({
      id: 'rag-pipeline-model',
      title: 'RAG Pipeline in Depth',
      summary: 'What sits between "embed and search" and a production-quality retrieval system.',
      nodes: [
        { id: 'root', label: 'RAG Pipeline', description: 'The stages that turn a raw query into grounded, cited context.', depth: 0, nodeType: 'concept' },
        { id: 'query_rewrite', label: 'Query Rewriting / HyDE', description: 'Expand or transform the query to close the vocabulary gap with the documents.', depth: 1, nodeType: 'process' },
        { id: 'hybrid_search', label: 'Hybrid Search', description: 'Dense vector similarity plus sparse keyword search, merged.', depth: 1, nodeType: 'process' },
        { id: 'rerank_n', label: 'Reranking', description: 'A precise second pass reorders and cuts candidates down.', depth: 1, nodeType: 'process' },
        { id: 'context_assembly', label: 'Context Assembly + Citations', description: 'Final passages are formatted into the prompt with source attribution.', depth: 1, nodeType: 'process' },
        { id: 'agentic_rag', label: 'Agentic RAG', description: 'The agent decides whether/when to retrieve again instead of retrieving exactly once.', depth: 1, nodeType: 'example' },
      ],
      edges: [
        { source: 'root', target: 'query_rewrite', edgeType: 'contains' },
        { source: 'query_rewrite', target: 'hybrid_search', edgeType: 'leads_to' },
        { source: 'hybrid_search', target: 'rerank_n', edgeType: 'leads_to' },
        { source: 'rerank_n', target: 'context_assembly', edgeType: 'leads_to' },
        { source: 'root', target: 'agentic_rag', edgeType: 'relates' },
      ],
      analogies: [
        {
          concept: 'RAG Pipeline',
          realWorldExample: 'A research librarian, not a card catalog',
          explanation:
            'A card catalog does one lookup and hands you what matches the exact words. A research librarian rephrases your question, checks multiple indexes, skims for actual relevance before handing anything over, and goes back for more if your question turns out to have layers. That extra work is the pipeline.',
          relatedNodeId: 'root',
        },
      ],
    }),
  },

  tool_contract: {
    id: 'tool_contract',
    kind: 'leaf',
    title: 'Anatomy of a Good Tool Contract',
    tagline: 'The five things that make a tool schema reliable instead of ambiguous.',
    icon: '📐',
    parentId: 'tool_use',
    principles: [
      {
        title: 'The description is a prompt, not documentation for humans',
        detail:
          "Write it the way you'd brief a new teammate on exactly when to reach for this tool versus another. Ambiguous descriptions cause the model to pick the wrong tool.",
      },
      {
        title: 'Constrain parameters as tightly as the schema allows',
        detail:
          "Enums over free strings, required fields marked required, sensible defaults. Every degree of freedom you don't constrain is a degree of freedom the model can get wrong.",
      },
      {
        title: 'Errors are part of the interface',
        detail:
          'A returned error should tell the model what to change, not just that it failed. "date must be YYYY-MM-DD, got \'next friday\'" beats "Error: invalid input".',
      },
      {
        title: 'Naming should tell the model when NOT to use it too',
        detail:
          "A tool called search_orders next to one called cancel_order needs a description explicit about the line between look-up and mutation — the model can't infer intent boundaries you didn't write down.",
      },
    ],
    code: {
      language: 'json',
      caption: 'Weak vs. strong tool description, same underlying function',
      code: `// Weak — invites wrong calls
{ "name": "order", "description": "Handles orders" }

// Strong — states exactly when to use it, and what it will not do
{
  "name": "cancel_order",
  "description": "Cancels a NOT-YET-SHIPPED order and refunds the payment method. \\
Do not use for shipped orders — use start_return instead. \\
Requires explicit user confirmation before calling.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "order_id": { "type": "string", "pattern": "^ORD-[0-9]{8}$" },
      "reason": { "type": "string", "enum": ["customer_request", "fraud", "duplicate"] }
    },
    "required": ["order_id", "reason"]
  }
}`,
    },
    model: buildModel({
      id: 'tool-contract-model',
      title: 'Tool Contract Anatomy',
      summary: 'Five parts of a tool schema, each a place ambiguity can creep in.',
      nodes: [
        { id: 'root', label: 'Tool Contract', description: 'The complete interface the model has to a real-world action.', depth: 0, nodeType: 'concept' },
        { id: 'name_n', label: 'Name', description: 'A clear verb_noun that signals exactly what happens.', depth: 1, nodeType: 'concept' },
        { id: 'desc_n', label: 'Description', description: 'When to use it, when not to, and any hard preconditions.', depth: 1, nodeType: 'concept' },
        { id: 'params_n', label: 'Parameters', description: 'Typed and constrained — enums and patterns beat free-form strings.', depth: 1, nodeType: 'concept' },
        { id: 'errors_n', label: 'Error Shape', description: 'Actionable messages that tell the model exactly what to fix.', depth: 1, nodeType: 'concept' },
        { id: 'confirm_n', label: 'Confirmation Gate', description: 'Destructive or irreversible actions require an explicit confirmation step.', depth: 1, nodeType: 'example' },
      ],
      edges: [
        { source: 'root', target: 'name_n', edgeType: 'contains' },
        { source: 'root', target: 'desc_n', edgeType: 'contains' },
        { source: 'root', target: 'params_n', edgeType: 'contains' },
        { source: 'root', target: 'errors_n', edgeType: 'contains' },
        { source: 'root', target: 'confirm_n', edgeType: 'contains' },
      ],
      analogies: [
        {
          concept: 'Tool Contract',
          realWorldExample: 'A well-labeled control panel vs. a wall of unmarked switches',
          explanation:
            "One panel has switches labeled 'Main power — do not use during business hours' with a cover over it. The other is unmarked. Both technically work. Only one is safe to hand to someone who has never seen the room before — which is exactly the position the model is in on every call.",
          relatedNodeId: 'root',
        },
      ],
    }),
  },

  guardrails: {
    id: 'guardrails',
    kind: 'leaf',
    title: 'Layered Guardrail Architecture',
    tagline: 'Input validation, output validation, sandboxing, and approval — four separate walls.',
    icon: '🛡️',
    parentId: 'production',
    principles: [
      {
        title: "Filter untrusted input before it ever reaches the model's instructions",
        detail:
          "Classify or strip suspicious content — injection attempts, PII — from retrieved documents and user uploads before they're concatenated into the prompt.",
      },
      {
        title: "Validate output against a schema or policy before it's used",
        detail:
          "Don't trust free-text output to be safe just because the prompt asked nicely. Validate structure, check for policy violations, and reject or retry on failure.",
      },
      {
        title: 'The sandbox is what actually contains a bad tool call',
        detail:
          'Least-privilege API keys, scoped filesystem access, network egress limits. Guardrails at the prompt level are a speed bump; the sandbox is the wall.',
      },
      {
        title: 'Approval gates should be proportional to blast radius, not universal',
        detail:
          'Gating every action kills the value of automation. Gating only the irreversible, costly, or externally visible ones keeps most of the system fast while containing the real risk.',
      },
    ],
    tradeoffs: [
      {
        dimension: 'Where to enforce',
        left: "Prompt-level instructions ('please don't...')",
        right: 'Code-level enforcement (schema validation, sandboxing, allowlists)',
        guidance:
          'Prompt-level guardrails are a first layer, never the only layer. Anything that actually matters must be enforced in code the model cannot talk its way around.',
      },
    ],
    frameworks: [
      { name: 'Guardrails AI / NeMo Guardrails', blurb: 'Libraries for schema-validating and policy-checking model input and output.' },
    ],
    code: {
      language: 'text',
      caption: 'Four checks, in order, before an action is allowed to happen',
      code: `assert input_filter.is_safe(user_input, retrieved_docs)     // 1. input
plan = model.decide(user_input)
assert plan.tool_call in allowlisted_tools(current_user)     // 2. sandbox
if plan.tool_call.is_irreversible:
    require_human_approval(plan)                              // 3. approval gate
result = execute_sandboxed(plan.tool_call)
assert output_validator.check(result)                         // 4. output`,
    },
    model: buildModel({
      id: 'guardrails-model',
      title: 'Guardrail Architecture',
      summary: 'Four independent walls, because any single filter has a blind spot.',
      nodes: [
        { id: 'root', label: 'Guardrails', description: 'Layered checks around every stage an agent can go wrong.', depth: 0, nodeType: 'concept' },
        { id: 'input_val', label: 'Input Validation', description: 'Strip or flag suspicious content before it reaches the prompt.', depth: 1, nodeType: 'process' },
        { id: 'tool_sandbox', label: 'Tool Execution Sandbox', description: 'Least-privilege credentials and isolation around anything a tool can touch.', depth: 1, nodeType: 'process' },
        { id: 'approval', label: 'Human Approval Gate', description: 'A checkpoint in front of irreversible or high-stakes actions.', depth: 1, nodeType: 'process' },
        { id: 'output_val', label: 'Output Validation', description: 'Schema and policy checks before a response is used or shown.', depth: 1, nodeType: 'process' },
        { id: 'monitor', label: 'Runtime Monitoring', description: 'Watching live traffic for the guardrail failures you did not anticipate.', depth: 2, nodeType: 'example' },
      ],
      edges: [
        { source: 'root', target: 'input_val', edgeType: 'contains' },
        { source: 'input_val', target: 'tool_sandbox', edgeType: 'leads_to' },
        { source: 'tool_sandbox', target: 'approval', edgeType: 'leads_to' },
        { source: 'root', target: 'output_val', edgeType: 'contains' },
        { source: 'output_val', target: 'monitor', edgeType: 'leads_to' },
      ],
      analogies: [
        {
          concept: 'Guardrails',
          realWorldExample: 'Airport security, not a single metal detector',
          explanation:
            'ID check, bag scan, metal detector, and a random secondary screening are separate, redundant layers — not because any one is unreliable, but because each catches a different failure mode. Guardrails work the same way: no single check is "the" guardrail.',
          relatedNodeId: 'root',
        },
      ],
    }),
  },
};

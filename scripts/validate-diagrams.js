#!/usr/bin/env node
/**
 * Validates Mermaid diagrams in mental-models/*.md
 * Catches syntax issues that cause diagrams to fail rendering.
 * Only validates flowchart blocks (mindmap syntax is different).
 */

const fs = require('fs');
const path = require('path');

const MENTAL_MODELS_DIR = path.join(__dirname, '..', 'mental-models');

// Extract all ```mermaid ... ``` blocks from markdown, returning only flowchart ones
function extractFlowchartBlocks(content) {
  const blocks = [];
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const block = match[1];
    if (/^\s*flowchart/m.test(block)) {
      blocks.push(block);
    }
  }
  return blocks;
}

// Extract node definition lines from a flowchart block
function getNodeLines(block) {
  const lines = [];
  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith('flowchart') ||
      trimmed.startsWith('classDef') ||
      trimmed.startsWith('class ') ||
      trimmed.startsWith('subgraph') ||
      trimmed.startsWith('end') ||
      trimmed.startsWith('%%') ||
      /-->|==>|-\.-|---/.test(trimmed)
    ) continue;
    lines.push(trimmed);
  }
  return lines;
}

const CHECKS = [
  {
    name: 'Broken parallelogram shape [/label/] — use (["label"]) for examples instead',
    test: (line) => /^\w+\[[\\/]/.test(line),
  },
  {
    name: 'Unquoted label with parentheses inside rounded-rect node — wrap label in double quotes: id("label (ABC)")',
    test: (line) => {
      // Match id(label) where label is NOT quoted and contains ( or )
      const m = line.match(/^\w+\(([^"({\[].+)\)$/);
      if (!m) return false;
      return /[()]/.test(m[1]);
    },
  },
  {
    name: 'Unquoted label with curly braces inside hexagon node — use id{{"label {x}"}}',
    test: (line) => {
      const m = line.match(/^\w+\{\{([^"'].+)\}\}$/);
      if (!m) return false;
      return /[{}]/.test(m[1]);
    },
  },
  {
    name: 'Old legend Example shape [/Example/] — update to (["Example"]):::example',
    test: (line) => /^L3\[\/Example\/\]/.test(line),
  },
];

let hasErrors = false;

const files = fs.readdirSync(MENTAL_MODELS_DIR)
  .filter(f => f.endsWith('.md'))
  .map(f => path.join(MENTAL_MODELS_DIR, f));

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const blocks = extractFlowchartBlocks(content);
  if (blocks.length === 0) continue;

  const relPath = path.relative(process.cwd(), file);
  const fileErrors = [];

  for (const block of blocks) {
    for (const line of getNodeLines(block)) {
      for (const check of CHECKS) {
        if (check.test(line)) {
          fileErrors.push(`  Line:  ${line}\n  Issue: ${check.name}`);
        }
      }
    }
  }

  if (fileErrors.length > 0) {
    hasErrors = true;
    console.error(`\nFAIL ${relPath}:`);
    for (const e of fileErrors) console.error(e);
  }
}

if (hasErrors) {
  console.error('\n✖ Diagram validation failed — fix the issues above before committing.\n');
  process.exit(1);
} else {
  console.log(`✔ Diagrams OK — validated ${files.length} file(s).`);
  process.exit(0);
}

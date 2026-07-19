import type { ConceptNode } from '@mental-model/core';

/**
 * Depth-based row layout, wrapping wide levels into multiple rows so a
 * pillar with 8-9 children doesn't turn into one very long horizontal line.
 */
export function layoutByDepth(nodes: Pick<ConceptNode, 'id' | 'depth'>[]): Map<string, { x: number; y: number }> {
  const byDepth = new Map<number, Pick<ConceptNode, 'id' | 'depth'>[]>();
  for (const node of nodes) {
    if (!byDepth.has(node.depth)) byDepth.set(node.depth, []);
    byDepth.get(node.depth)!.push(node);
  }

  const hSpacing = 260;
  const vSpacing = 180;
  const maxPerRow = 5;
  const positions = new Map<string, { x: number; y: number }>();

  for (const [depth, levelNodes] of byDepth) {
    const rows: (typeof levelNodes)[] = [];
    for (let i = 0; i < levelNodes.length; i += maxPerRow) {
      rows.push(levelNodes.slice(i, i + maxPerRow));
    }
    rows.forEach((row, rowIdx) => {
      const levelWidth = row.length * hSpacing;
      const startX = -levelWidth / 2 + hSpacing / 2;
      row.forEach((node, idx) => {
        positions.set(node.id, {
          x: startX + idx * hSpacing,
          y: depth * vSpacing * 1.7 + rowIdx * (vSpacing * 0.95),
        });
      });
    });
  }

  return positions;
}

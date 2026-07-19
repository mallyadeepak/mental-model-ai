import type { TopicContent } from '../types.js';
import { ATLAS_ID, atlasModel } from './atlas.js';
import { pillars } from './pillars.js';
import { leaves } from './leaves.js';
import { playbookCards } from './playbook.js';

export { ATLAS_ID, atlasModel, pillars, leaves, playbookCards };

const topicsById: Record<string, TopicContent> = { ...pillars, ...leaves };

export function getTopic(id: string): TopicContent | undefined {
  return topicsById[id];
}

export function getPillarList(): TopicContent[] {
  return Object.values(pillars);
}

/** Breadcrumb trail from the Atlas down to this topic, inclusive. */
export function getBreadcrumb(topicId: string): { id: string; title: string }[] {
  const trail: { id: string; title: string }[] = [];
  let current: TopicContent | undefined = getTopic(topicId);
  while (current) {
    trail.unshift({ id: current.id, title: current.title });
    const parentId: string = current.parentId ?? ATLAS_ID;
    if (parentId === ATLAS_ID) break;
    current = getTopic(parentId);
  }
  trail.unshift({ id: ATLAS_ID, title: 'Atlas' });
  return trail;
}

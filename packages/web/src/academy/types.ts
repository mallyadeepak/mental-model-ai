import type { MentalModel } from '@mental-model/core';

export interface Principle {
  title: string;
  detail: string;
}

export interface Tradeoff {
  dimension: string;
  left: string;
  right: string;
  guidance: string;
}

export interface FrameworkRef {
  name: string;
  blurb: string;
}

export interface CodeSample {
  language: string;
  caption: string;
  code: string;
}

export type TopicKind = 'pillar' | 'leaf';

/**
 * A single page in the Academy: an overview diagram plus the teaching
 * material around it (principles, tradeoffs, frameworks, code).
 * Pillars sit one level below the Atlas; leaves sit one level below a pillar.
 */
export interface TopicContent {
  id: string;
  kind: TopicKind;
  title: string;
  tagline: string;
  icon: string;
  parentId: string | null;
  model: MentalModel;
  principles: Principle[];
  tradeoffs?: Tradeoff[];
  frameworks?: FrameworkRef[];
  code?: CodeSample;
  /** node id in `model` -> id of a leaf TopicContent it drills into */
  deepDives?: Record<string, string>;
  furtherReading?: string;
}

export interface PlaybookCard {
  id: string;
  prompt: string;
  recommendation: string;
  rationale: string;
  links: { label: string; topicId: string }[];
}

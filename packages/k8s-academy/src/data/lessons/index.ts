import type { Lesson } from '../types';
import { podsLesson } from './pods';
import { schedulingLesson } from './scheduling';
import { deploymentsLesson } from './deployments';
import { scalingLesson } from './scaling';
import { probesLesson } from './probes';
import { rollingUpdatesLesson } from './rolling-updates';
import { servicesLesson } from './services';
import { ingressLesson } from './ingress';
import { configLesson } from './config';
import { namespacesLesson } from './namespaces';
import { jobsLesson } from './jobs';
import { statefulDaemonLesson } from './statefulsets-daemonsets';

export const lessons: Lesson[] = [
  podsLesson,
  schedulingLesson,
  deploymentsLesson,
  scalingLesson,
  probesLesson,
  rollingUpdatesLesson,
  servicesLesson,
  ingressLesson,
  configLesson,
  namespacesLesson,
  jobsLesson,
  statefulDaemonLesson,
];

export const lessonById = Object.fromEntries(lessons.map((l) => [l.id, l]));

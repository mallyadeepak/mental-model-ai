import type {
  City,
  InterestKey,
  InterestWeights,
  ItineraryBlock,
  ItineraryDay,
  MeetPeopleIdea,
  Place,
} from '../types';
import { weightedRoundRobin } from './wrr';

const OUTDOOR_KEYWORDS = ['hike', 'trek', 'surf', 'bike', 'trail', 'kayak', 'volcano', 'paraglid', 'run club', 'climb', 'ski'];

function cyclicPicker<T>(pool: T[], seed = 0) {
  let cursor = seed;
  return (): T | undefined => {
    if (pool.length === 0) return undefined;
    const item = pool[cursor % pool.length];
    cursor += 1;
    return item;
  };
}

function placeBlock(timeOfDay: ItineraryBlock['timeOfDay'], category: ItineraryBlock['category'], place: Place | undefined, verbPhrase: string, fallbackTitle: string): ItineraryBlock {
  if (!place) {
    return {
      timeOfDay,
      title: fallbackTitle,
      description: 'Wander without a plan — some of the best solo-travel moments happen when you just follow your nose.',
      category,
    };
  }
  return {
    timeOfDay,
    title: `${verbPhrase} in ${place.area}`,
    description: `${place.name} — ${place.note}.`,
    category,
  };
}

function meetPeopleBlock(timeOfDay: ItineraryBlock['timeOfDay'], idea: MeetPeopleIdea | undefined, category: ItineraryBlock['category']): ItineraryBlock {
  if (!idea) {
    return {
      timeOfDay,
      title: 'Free time',
      description: 'An open block — good for resting, journaling, or following up with someone you met earlier in the trip.',
      category,
    };
  }
  return {
    timeOfDay,
    title: idea.activity,
    description: idea.description,
    category,
  };
}

function neighborhoodBlock(timeOfDay: ItineraryBlock['timeOfDay'], neighborhood: City['neighborhoods'][number] | undefined, framing: string): ItineraryBlock {
  if (!neighborhood) {
    return {
      timeOfDay,
      title: 'Explore on foot',
      description: 'Pick a direction and walk — let the city surprise you.',
      category: 'explore',
    };
  }
  return {
    timeOfDay,
    title: `${framing} ${neighborhood.name}`,
    description: neighborhood.vibe,
    category: 'explore',
  };
}

export const DEFAULT_WEIGHTS: InterestWeights = {
  cafeCulture: 60,
  nightlifeSocial: 70,
  foodie: 55,
  outdoors: 35,
  cultureHistory: 50,
};

const DAY_THEMES = [
  'Arrival & first impressions',
  'Settling into the rhythm',
  'Going deeper',
  'Off the main streets',
  'Local favorites',
  'One more round',
  'Slow morning, easy exit',
];

export function generateItinerary(
  city: City,
  days: number,
  weights: InterestWeights = DEFAULT_WEIGHTS,
  seed = 0
): ItineraryDay[] {
  const clampedDays = Math.max(1, Math.min(14, Math.round(days)));

  const nextCafe = cyclicPicker(city.cafes, seed);
  const nextBar = cyclicPicker(city.bars, seed);
  const nextRestaurant = cyclicPicker(city.restaurants, seed);
  const nextNeighborhood = cyclicPicker(city.neighborhoods, seed);

  const outdoorIdeas = city.meetPeople.filter((m) =>
    OUTDOOR_KEYWORDS.some((kw) => m.activity.toLowerCase().includes(kw))
  );
  const socialIdeas = city.meetPeople.filter((m) => !outdoorIdeas.includes(m));
  const nextOutdoorIdea = cyclicPicker(outdoorIdeas.length > 0 ? outdoorIdeas : city.meetPeople, seed);
  const nextSocialIdea = cyclicPicker(socialIdeas.length > 0 ? socialIdeas : city.meetPeople, seed);

  const morningKeys: InterestKey[] = ['cafeCulture', 'cultureHistory', 'outdoors'];
  const afternoonKeys: InterestKey[] = ['cultureHistory', 'outdoors', 'foodie'];
  const eveningKeys: InterestKey[] = ['nightlifeSocial', 'foodie', 'cafeCulture'];

  const morningSeq = weightedRoundRobin(
    morningKeys.map((key) => ({ key, weight: weights[key] })),
    clampedDays
  );
  const afternoonSeq = weightedRoundRobin(
    afternoonKeys.map((key) => ({ key, weight: weights[key] })),
    clampedDays
  );
  const eveningSeq = weightedRoundRobin(
    eveningKeys.map((key) => ({ key, weight: weights[key] })),
    clampedDays
  );

  const days_: ItineraryDay[] = [];

  for (let i = 0; i < clampedDays; i++) {
    let morning: ItineraryBlock;
    switch (morningSeq[i]) {
      case 'cafeCulture':
        morning = placeBlock('Morning', 'cafe', nextCafe(), 'Slow coffee', 'Coffee somewhere unplanned');
        break;
      case 'outdoors':
        morning = meetPeopleBlock('Morning', nextOutdoorIdea(), 'outdoors');
        break;
      default:
        morning = neighborhoodBlock('Morning', nextNeighborhood(), 'Wander');
    }

    let afternoon: ItineraryBlock;
    switch (afternoonSeq[i]) {
      case 'outdoors':
        afternoon = meetPeopleBlock('Afternoon', nextOutdoorIdea(), 'outdoors');
        break;
      case 'foodie':
        afternoon = placeBlock('Afternoon', 'food', nextRestaurant(), 'Lunch', 'Find lunch wherever looks good');
        break;
      default:
        afternoon = neighborhoodBlock('Afternoon', nextNeighborhood(), 'Go deeper into');
    }

    let evening: ItineraryBlock;
    switch (eveningSeq[i]) {
      case 'foodie':
        evening = placeBlock('Evening', 'food', nextRestaurant(), 'Dinner', 'Dinner wherever smells best');
        break;
      case 'cafeCulture':
        evening = placeBlock('Evening', 'cafe', nextCafe(), 'A quiet evening coffee or wine', 'A quiet evening in');
        break;
      default: {
        // Nightlife/social: alternate between a bar and a structured meet-people activity.
        if (i % 2 === 0) {
          evening = placeBlock('Evening', 'bar', nextBar(), 'Drinks', 'Find a bar and see who is there');
        } else {
          evening = meetPeopleBlock('Evening', nextSocialIdea(), 'social');
        }
      }
    }

    // Avoid the same specific activity showing up twice in one day (small pools can
    // otherwise produce e.g. the same outdoor activity for both morning and afternoon).
    if (afternoon.title === morning.title) {
      afternoon = neighborhoodBlock('Afternoon', nextNeighborhood(), 'Go deeper into');
    }
    if (evening.title === morning.title || evening.title === afternoon.title) {
      evening = placeBlock('Evening', 'bar', nextBar(), 'Drinks', 'Find a bar and see who is there');
    }

    days_.push({
      day: i + 1,
      theme: DAY_THEMES[i] ?? `Day ${i + 1}`,
      blocks: [morning, afternoon, evening],
    });
  }

  return days_;
}

export function itineraryToText(city: City, itinerary: ItineraryDay[], weights: InterestWeights): string {
  const lines: string[] = [];
  lines.push(`${city.name}, ${city.country} — ${itinerary.length}-day solo itinerary`);
  lines.push(`Focus: ${describeWeights(weights)}`);
  lines.push('');
  for (const day of itinerary) {
    lines.push(`Day ${day.day}: ${day.theme}`);
    for (const block of day.blocks) {
      lines.push(`  ${block.timeOfDay}: ${block.title}`);
      lines.push(`    ${block.description}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function describeWeights(weights: InterestWeights): string {
  const entries = Object.entries(weights) as [InterestKey, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const labels: Record<InterestKey, string> = {
    cafeCulture: 'café culture',
    nightlifeSocial: 'nightlife & social',
    foodie: 'food',
    outdoors: 'outdoors',
    cultureHistory: 'culture & history',
  };
  return sorted
    .slice(0, 3)
    .map(([key]) => labels[key])
    .join(', ');
}

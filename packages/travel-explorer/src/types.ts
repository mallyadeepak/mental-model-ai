export type Continent =
  | 'Europe'
  | 'Central America'
  | 'South America'
  | 'Asia'
  | 'Africa'
  | 'North America'
  | 'Oceania';

export type VibeTag =
  | 'cafe-culture'
  | 'nightlife'
  | 'social-scene'
  | 'digital-nomad'
  | 'walkable'
  | 'history'
  | 'foodie'
  | 'art-design'
  | 'beach'
  | 'mountains-outdoors'
  | 'nightlife-chill'
  | 'lgbtq-friendly'
  | 'wellness'
  | 'live-music';

export const VIBE_LABELS: Record<VibeTag, { label: string; emoji: string }> = {
  'cafe-culture': { label: 'Café culture', emoji: '☕' },
  nightlife: { label: 'Nightlife', emoji: '🌃' },
  'social-scene': { label: 'Easy to meet people', emoji: '🤝' },
  'digital-nomad': { label: 'Digital nomad hub', emoji: '💻' },
  walkable: { label: 'Walkable', emoji: '🚶' },
  history: { label: 'History & old town', emoji: '🏛️' },
  foodie: { label: 'Foodie', emoji: '🍽️' },
  'art-design': { label: 'Art & design', emoji: '🎨' },
  beach: { label: 'Beach / coast', emoji: '🏖️' },
  'mountains-outdoors': { label: 'Mountains & outdoors', emoji: '🥾' },
  'nightlife-chill': { label: 'Low-key evenings', emoji: '🕯️' },
  'lgbtq-friendly': { label: 'LGBTQ+ friendly', emoji: '🏳️‍🌈' },
  wellness: { label: 'Wellness', emoji: '🧘' },
  'live-music': { label: 'Live music', emoji: '🎷' },
};

export interface Place {
  name: string;
  area: string;
  note: string;
}

export interface MeetPeopleIdea {
  activity: string;
  description: string;
}

export interface Neighborhood {
  name: string;
  vibe: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  continent: Continent;
  region: string;
  coordinates: [number, number];
  tagline: string;
  summary: string;
  soloScore: number;
  safetyScore: number;
  socialScore: number;
  costLevel: 1 | 2 | 3 | 4;
  pace: 'slow' | 'balanced' | 'fast';
  bestMonths: number[];
  idealTripLength: string;
  languages: string[];
  currency: string;
  vibeTags: VibeTag[];
  neighborhoods: Neighborhood[];
  cafes: Place[];
  bars: Place[];
  restaurants: Place[];
  meetPeople: MeetPeopleIdea[];
  gettingAround: string;
  whyForSolo: string;
  safetyNotes: string;
}

export type InterestKey =
  | 'cafeCulture'
  | 'nightlifeSocial'
  | 'foodie'
  | 'outdoors'
  | 'cultureHistory';

export interface InterestWeights {
  cafeCulture: number;
  nightlifeSocial: number;
  foodie: number;
  outdoors: number;
  cultureHistory: number;
}

export type BlockCategory =
  | 'explore'
  | 'cafe'
  | 'food'
  | 'social'
  | 'bar'
  | 'culture'
  | 'rest'
  | 'outdoors';

export interface ItineraryBlock {
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
  title: string;
  description: string;
  category: BlockCategory;
}

export interface ItineraryDay {
  day: number;
  theme: string;
  blocks: ItineraryBlock[];
}

export interface TripPlan {
  id: string;
  cityId: string;
  days: number;
  weights: InterestWeights;
  itinerary: ItineraryDay[];
  createdAt: string;
}

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const COST_LABELS: Record<City['costLevel'], string> = {
  1: '$',
  2: '$$',
  3: '$$$',
  4: '$$$$',
};

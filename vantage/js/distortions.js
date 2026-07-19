// Ten thinking patterns adapted from Aaron Beck's and David Burns's cognitive
// distortion lists — the standard CBT vocabulary for how anxious thought
// exaggerates or distorts a situation. Naming the pattern is itself useful:
// it turns "this is just true" into "this is a familiar habit of thought."

export const DISTORTIONS = [
  {
    id: 'catastrophizing',
    name: 'Catastrophizing',
    description: 'Jumping to the worst possible outcome, as if it were the most likely one.',
    prompt: "What's the most likely outcome, not just the worst one? What would you tell a friend who had this exact thought?",
  },
  {
    id: 'fortune-telling',
    name: 'Fortune-telling',
    description: 'Predicting the future will go badly, without real evidence for it.',
    prompt: 'What evidence do you actually have? Have you predicted this before and been wrong?',
  },
  {
    id: 'mind-reading',
    name: 'Mind reading',
    description: "Assuming you know what someone else is thinking, usually something negative about you.",
    prompt: 'What did they actually say or do? Is there another explanation for their behavior?',
  },
  {
    id: 'all-or-nothing',
    name: 'All-or-nothing thinking',
    description: 'Seeing things in absolutes — perfect or a total failure, safe or catastrophic, with no middle ground.',
    prompt: 'Where does this actually fall between the two extremes?',
  },
  {
    id: 'overgeneralization',
    name: 'Overgeneralization',
    description: 'Taking one bad event as proof of a never-ending pattern.',
    prompt: 'Is this really "always" or "never"? Can you think of an exception?',
  },
  {
    id: 'should-statements',
    name: 'Should statements',
    description: 'Holding yourself or others to rigid rules about how things "should" be, and feeling like a failure when reality differs.',
    prompt: 'Whose rule is this? What would a more flexible expectation look like?',
  },
  {
    id: 'personalization',
    name: 'Personalization',
    description: 'Taking the blame for something that was not entirely, or even mostly, within your control.',
    prompt: 'What parts of this were actually within your control, and what parts were not?',
  },
  {
    id: 'discounting-positive',
    name: 'Discounting the positive',
    description: 'Dismissing good things that happen or that you did, as if they don\'t count.',
    prompt: "What's a positive fact here that you're brushing past?",
  },
  {
    id: 'emotional-reasoning',
    name: 'Emotional reasoning',
    description: '"I feel it, so it must be true" — treating a feeling as proof of fact.',
    prompt: 'If a feeling is strong, does that make it accurate? What would the facts alone say?',
  },
  {
    id: 'labeling',
    name: 'Labeling',
    description: 'Attaching a harsh, global label to yourself or someone else based on one event.',
    prompt: 'What happened, specifically — described as an event, not as a permanent trait?',
  },
];

export function getDistortion(id) {
  return DISTORTIONS.find((d) => d.id === id) || null;
}

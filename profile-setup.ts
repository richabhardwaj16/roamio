export const RELIGIONS = [
  "Hindu",
  "Muslim",
  "Christian",
  "Sikh",
  "Buddhist",
  "Jain",
  "Jewish",
  "Atheist",
  "Spiritual",
  "Other",
  "Prefer not to say",
] as const;

export const RELATIONSHIP_GOALS = [
  "Travel Buddy",
  "Adventure Partner",
  "Group Trips",
  "Just Exploring",
] as const;

export const TRAVEL_FREQUENCY = [
  "Once a year",
  "2-3 trips/year",
  "Every few months",
  "Monthly",
  "Always travelling",
] as const;

export const VIBES = [
  "Luxury Lover",
  "Budget Backpacker",
  "Culture Explorer",
  "Party Nomad",
  "Nature Seeker",
  "Digital Nomad",
  "Foodie Traveler",
  "Adventure Junkie",
  "Slow Traveler",
  "Spiritual Explorer",
] as const;

export const INDIAN_STATES = [
  "New to Travelling",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const PROMPT_OPTIONS = [
  "My ideal trip looks like...",
  "The one place I'll always return to...",
  "My travel red flag is...",
  "A place that changed my perspective was...",
  "My dream destination right now is...",
] as const;

export type ProfilePrompt = {
  question: string;
  answer: string;
};

export type ProfileSetupDraft = {
  fullName: string;
  age: string;
  gender: string;
  religion: string;
  hometown: string;
  goal: string;
  frequency: string;
  bio: string;
  vibes: string[];
  statesVisited: string[];
  prompts: ProfilePrompt[];
  travelStats: {
    budget: number;
    energy: number;
    planning: number;
    social: number;
  };
  photos: string[];
  profileCompleted: boolean;
};

export const createEmptyProfileDraft = (): ProfileSetupDraft => ({
  fullName: "",
  age: "",
  gender: "",
  religion: "",
  hometown: "",
  goal: "",
  frequency: "",
  bio: "",
  vibes: [],
  statesVisited: [],
  prompts: PROMPT_OPTIONS.slice(0, 3).map((question) => ({
    question,
    answer: "",
  })),
  travelStats: {
    budget: 0.5,
    energy: 0.5,
    planning: 0.5,
    social: 0.5,
  },
  photos: Array(6).fill(""),
  profileCompleted: false,
});

export const buildRealtimeProfilePayload = (
  uid: string,
  draft: ProfileSetupDraft
) => ({
  uid,
  fullName: draft.fullName.trim(),
  age: Number(draft.age),
  gender: draft.gender,
  religion: draft.religion,
  hometown: draft.hometown.trim(),
  goal: draft.goal,
  frequency: draft.frequency,
  bio: draft.bio.trim(),
  vibes: draft.vibes,
  statesVisited: draft.statesVisited,
  prompts: draft.prompts.filter((prompt) => prompt.answer.trim().length > 0),
  travelStats: draft.travelStats,
  photos: draft.photos.filter(Boolean),
  profileCompleted: true,
  updatedAt: Date.now(),
});

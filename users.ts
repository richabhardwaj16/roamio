// app/data/users.ts

export type MediaBlock =
  | { type: "image"; source: any }
  | { type: "prompt"; question: string; answer: string };

export type User = {
  id: string;
  name: string;
  age: number;

  vibe: number;
  budget: number;
  spontaneity: number;
  food: number;
  adventure: number;

  statesVisited: string[];

  media: MediaBlock[];
};

export const USERS: User[] = [

  {
    id: "sanika",
    name: "Sanika",
    age: 22,
    vibe: 0.9,
    budget: 0.6,
    spontaneity: 0.8,
    food: 0.7,
    adventure: 0.9,
    statesVisited: ["Maharashtra", "Goa", "Kerala", "Rajasthan"],

    media: [
      { type: "image", source: require("../../assets/users/sanika/profile.jpeg") },
      { type: "prompt", question: "My ideal trip looks like...", answer: "Spontaneous coastal road trips." },
      { type: "image", source: require("../../assets/users/sanika/gallery1.jpeg") },
      { type: "image", source: require("../../assets/users/sanika/gallery2.jpeg") },
      { type: "prompt", question: "The one place I’ll return to...", answer: "Kerala backwaters." },
      { type: "image", source: require("../../assets/users/sanika/gallery3.jpeg") },
      { type: "prompt", question: "Travel green flag?", answer: "Someone who loves sunrise views." },
      { type: "image", source: require("../../assets/users/sanika/gallery4.jpeg") },
      { type: "image", source: require("../../assets/users/sanika/cover.jpeg") }
    ]
  },

  {
    id: "vidhi",
    name: "Vidhi",
    age: 23,
    vibe: 0.7,
    budget: 0.8,
    spontaneity: 0.6,
    food: 0.9,
    adventure: 0.6,
    statesVisited: ["Delhi", "Himachal Pradesh", "Uttarakhand"],

    media: [
      { type: "image", source: require("../../assets/users/vidhi/profile.jpeg") },
      { type: "prompt", question: "My ideal trip looks like...", answer: "Mountain cafés and slow mornings." },
      { type: "image", source: require("../../assets/users/vidhi/gallery1.jpeg") },
      { type: "image", source: require("../../assets/users/vidhi/gallery2.jpeg") },
      { type: "prompt", question: "Travel personality?", answer: "Organised but flexible." },
      { type: "image", source: require("../../assets/users/vidhi/gallery3.jpeg") },
      { type: "prompt", question: "Favorite travel vibe?", answer: "Cool weather & hot chai." },
      { type: "image", source: require("../../assets/users/vidhi/gallery4.jpeg") },
      { type: "image", source: require("../../assets/users/vidhi/cover.jpeg") }
    ]
  },

  {
    id: "bhakti",
    name: "Bhakti",
    age: 24,
    vibe: 0.5,
    budget: 0.9,
    spontaneity: 0.4,
    food: 0.8,
    adventure: 0.5,
    statesVisited: ["Gujarat", "Rajasthan", "Madhya Pradesh"],

    media: [
      { type: "image", source: require("../../assets/users/bhakti/profile.jpeg") },
      { type: "prompt", question: "My ideal trip looks like...", answer: "Cultural cities & architecture walks." },
      { type: "image", source: require("../../assets/users/bhakti/gallery1.jpeg") },
      { type: "image", source: require("../../assets/users/bhakti/gallery2.jpeg") },
      { type: "prompt", question: "Travel red flag?", answer: "No itinerary at all." },
      { type: "image", source: require("../../assets/users/bhakti/gallery3.jpeg") },
      { type: "prompt", question: "Dream state?", answer: "Rajasthan again." },
      { type: "image", source: require("../../assets/users/bhakti/gallery4.jpeg") },
      { type: "image", source: require("../../assets/users/bhakti/cover.jpeg") }
    ]
  },

  {
    id: "richa",
    name: "Richa",
    age: 22,
    vibe: 0.8,
    budget: 0.4,
    spontaneity: 0.9,
    food: 0.6,
    adventure: 0.8,
    statesVisited: ["Goa", "Karnataka", "Tamil Nadu"],

    media: [
      { type: "image", source: require("../../assets/users/richa/profile.jpeg") },
      { type: "prompt", question: "My ideal trip looks like...", answer: "Beach + party + zero planning." },
      { type: "image", source: require("../../assets/users/richa/gallery1.jpeg") },
      { type: "image", source: require("../../assets/users/richa/gallery2.jpeg") },
      { type: "prompt", question: "Travel habit?", answer: "Late night city walks." },
      { type: "image", source: require("../../assets/users/richa/gallery3.jpeg") },
      { type: "prompt", question: "Biggest thrill?", answer: "Spontaneous flights." },
      { type: "image", source: require("../../assets/users/richa/gallery4.jpeg") },
      { type: "image", source: require("../../assets/users/richa/cover.jpeg") }
    ]
  },

  {
    id: "khwaish",
    name: "Khwaish",
    age: 23,
    vibe: 0.85,
    budget: 0.7,
    spontaneity: 0.75,
    food: 0.9,
    adventure: 0.8,
    statesVisited: ["Punjab", "Delhi", "Uttarakhand"],

    media: [
      { type: "image", source: require("../../assets/users/khwaish/profile.jpeg") },
      { type: "prompt", question: "My ideal trip looks like...", answer: "Hill stations & dhabas." },
      { type: "image", source: require("../../assets/users/khwaish/gallery1.jpeg") },
      { type: "image", source: require("../../assets/users/khwaish/gallery2.jpeg") },
      { type: "prompt", question: "Travel green flag?", answer: "Sunrise person." },
      { type: "image", source: require("../../assets/users/khwaish/gallery3.jpeg") },
      { type: "prompt", question: "Favorite memory?", answer: "Manali snowfall." },
      { type: "image", source: require("../../assets/users/khwaish/gallery4.jpeg") },
      { type: "image", source: require("../../assets/users/khwaish/cover.jpeg") }
    ]
  },

  {
    id: "abhay",
    name: "Abhay",
    age: 25,
    vibe: 0.6,
    budget: 0.7,
    spontaneity: 0.5,
    food: 0.7,
    adventure: 0.6,
    statesVisited: ["Maharashtra", "Goa", "Karnataka"],

    media: [
      { type: "image", source: require("../../assets/users/abhay/profile.jpeg") },
      { type: "prompt", question: "My ideal trip looks like...", answer: "Well-planned cultural exploration." },
      { type: "image", source: require("../../assets/users/abhay/gallery1.jpeg") },
      { type: "image", source: require("../../assets/users/abhay/gallery2.jpeg") },
      { type: "prompt", question: "Travel style?", answer: "Structured & organised." },
      { type: "image", source: require("../../assets/users/abhay/gallery3.jpeg") },
      { type: "prompt", question: "Favorite destination?", answer: "Coastal Karnataka." },
      { type: "image", source: require("../../assets/users/abhay/gallery4.jpeg") },
      { type: "image", source: require("../../assets/users/abhay/cover.jpeg") }
    ]
  },

  {
    id: "tanishq",
    name: "Tanishq",
    age: 23,
    vibe: 0.9,
    budget: 0.5,
    spontaneity: 0.9,
    food: 0.4,
    adventure: 0.9,
    statesVisited: ["Ladakh", "Sikkim", "Himachal Pradesh"],

    media: [
      { type: "image", source: require("../../assets/users/tanishq/profile.jpeg") },
      { type: "prompt", question: "My ideal trip looks like...", answer: "High altitude adventures." },
      { type: "image", source: require("../../assets/users/tanishq/gallery1.jpeg") },
      { type: "image", source: require("../../assets/users/tanishq/gallery2.jpeg") },
      { type: "prompt", question: "Biggest thrill?", answer: "Unplanned mountain drives." },
      { type: "image", source: require("../../assets/users/tanishq/gallery3.jpeg") },
      { type: "prompt", question: "Dream trip?", answer: "Spiti in winter." },
      { type: "image", source: require("../../assets/users/tanishq/gallery4.jpeg") },
      { type: "image", source: require("../../assets/users/tanishq/cover.jpeg") }
    ]
  },

  {
    id: "krish",
    name: "Krish",
    age: 24,
    vibe: 0.75,
    budget: 0.6,
    spontaneity: 0.8,
    food: 0.85,
    adventure: 0.7,
    statesVisited: ["Rajasthan", "Gujarat", "Goa", "Kerala"],

    media: [
      { type: "image", source: require("../../assets/users/krish/profile.jpeg") },
      { type: "prompt", question: "My ideal trip looks like...", answer: "Desert safaris & sunsets." },
      { type: "image", source: require("../../assets/users/krish/gallery1.jpeg") },
      { type: "image", source: require("../../assets/users/krish/gallery2.jpeg") },
      { type: "prompt", question: "Travel vibe?", answer: "Spontaneous foodie explorer." },
      { type: "image", source: require("../../assets/users/krish/gallery3.jpeg") },
      { type: "prompt", question: "Must-have on trips?", answer: "Good company & great food." },
      { type: "image", source: require("../../assets/users/krish/gallery4.jpeg") },
      { type: "image", source: require("../../assets/users/krish/cover.jpeg") }
    ]
  }

];
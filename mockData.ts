export type DestinationCatalogItem = {
  id: string;
  name: string;
  state: string;
  country: string;
  vibe: string;
  budget: string;
  lat: number;
  lon: number;
  rating: number;
  tags: string[];
  description: string;
  fact: string;
};

export type SampleTraveler = {
  id: string;
  name: string;
  age: number;
  city: string;
  hometown: string;
  destination: string;
  budget: string;
  travelStyle: string;
  interests: string[];
  travelerDNA: {
    socialPreference: number;
    budgetStyle: number;
    planningStyle: number;
    energyLevel: number;
  };
  profilePicture: string;
  photos: string[];
  prompts: { question: string; answer: string }[];
};

export const destinationCatalog: DestinationCatalogItem[] = [
  { id: "goa", name: "Goa", state: "Goa", country: "India", vibe: "Beach and nightlife", budget: "Flexible", lat: 15.2993, lon: 74.124, rating: 4.6, tags: ["beach", "music", "hostels", "cafes"], description: "Coastal stays, scooter routes, party pockets, and easy long-weekend planning.", fact: "Goa blends Konkan culture with a long Indo-Portuguese architectural legacy." },
  { id: "jaipur", name: "Jaipur", state: "Rajasthan", country: "India", vibe: "Culture and architecture", budget: "Mid-range", lat: 26.9124, lon: 75.7873, rating: 4.7, tags: ["heritage", "food", "markets", "forts"], description: "Pink City routes with forts, bazaars, rooftop dining, and strong rail links.", fact: "Jaipur was founded in 1727 and is widely recognized as one of India's earliest planned cities." },
  { id: "udaipur", name: "Udaipur", state: "Rajasthan", country: "India", vibe: "Lakes and royal calm", budget: "Mid-range", lat: 24.5854, lon: 73.7125, rating: 4.8, tags: ["lakes", "palaces", "romantic", "sunset"], description: "Lakefront stays, palace circuits, and slower evenings with classic Rajasthan views.", fact: "Udaipur is often called the City of Lakes because of its interconnected artificial lakes." },
  { id: "jaisalmer", name: "Jaisalmer", state: "Rajasthan", country: "India", vibe: "Desert escape", budget: "Mid-range", lat: 26.9157, lon: 70.9083, rating: 4.6, tags: ["desert", "camping", "fort", "sunrise"], description: "Golden fort views, dune camps, jeep rides, and strong winter travel appeal.", fact: "Jaisalmer Fort is one of the rare living forts in the world, with residents still inside it." },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra", country: "India", vibe: "Urban energy", budget: "Flexible", lat: 19.076, lon: 72.8777, rating: 4.5, tags: ["city", "food", "nightlife", "sea"], description: "Fast city itineraries, sea-facing walks, cafe hopping, and strong flight connectivity.", fact: "Mumbai sits on a natural deep-water harbor that helped shape it into a major port city." },
  { id: "pune", name: "Pune", state: "Maharashtra", country: "India", vibe: "Weekend culture hub", budget: "Budget-friendly", lat: 18.5204, lon: 73.8567, rating: 4.3, tags: ["cafes", "culture", "young", "roadtrips"], description: "An easy base for food, student energy, monsoon drives, and hill-station escapes.", fact: "Pune has long been known as an education and cultural center in western India." },
  { id: "lonavala", name: "Lonavala", state: "Maharashtra", country: "India", vibe: "Monsoon hills", budget: "Budget-friendly", lat: 18.7546, lon: 73.4062, rating: 4.4, tags: ["hills", "monsoon", "roadtrip", "greenery"], description: "Short hill escapes with forts, waterfalls, and easy access from Mumbai and Pune.", fact: "Lonavala is famous for chikki and for its heavy monsoon rainfall in the Sahyadris." },
  { id: "kochi", name: "Kochi", state: "Kerala", country: "India", vibe: "Coastal heritage", budget: "Mid-range", lat: 9.9312, lon: 76.2673, rating: 4.5, tags: ["harbor", "art", "history", "cafes"], description: "Fort Kochi walks, sea-facing stays, art districts, and easy Kerala trip extensions.", fact: "Kochi's Chinese fishing nets are among the city's most recognizable coastal landmarks." },
  { id: "munnar", name: "Munnar", state: "Kerala", country: "India", vibe: "Tea hills and mist", budget: "Mid-range", lat: 10.0889, lon: 77.0595, rating: 4.8, tags: ["hills", "tea", "mist", "nature"], description: "Tea-estate drives, cool weather, viewpoints, and slower nature-first itineraries.", fact: "Munnar's landscape was developed heavily for tea plantations during the colonial era." },
  { id: "alleppey", name: "Alleppey", state: "Kerala", country: "India", vibe: "Backwater calm", budget: "Flexible", lat: 9.4981, lon: 76.3388, rating: 4.7, tags: ["backwaters", "houseboats", "slowtravel", "water"], description: "Backwater cruises, village routes, and slow travel with easy access to Kochi.", fact: "Alleppey is known as the Venice of the East because of its canals and backwaters." },
  { id: "manali", name: "Manali", state: "Himachal Pradesh", country: "India", vibe: "Mountain adventure", budget: "Mid-range", lat: 32.2432, lon: 77.1892, rating: 4.6, tags: ["mountains", "snow", "adventure", "cafes"], description: "Popular for road journeys, mountain stays, adventure sports, and cool-weather breaks.", fact: "Manali lies on the Beas River valley and is a major gateway to high Himalayan routes." },
  { id: "shimla", name: "Shimla", state: "Himachal Pradesh", country: "India", vibe: "Colonial hill stay", budget: "Mid-range", lat: 31.1048, lon: 77.1734, rating: 4.4, tags: ["hillstation", "walks", "heritage", "views"], description: "Ridge walks, toy-train add-ons, colonial architecture, and family-friendly travel pacing.", fact: "Shimla served as the summer capital of British India for many decades." },
  { id: "leh", name: "Leh", state: "Ladakh", country: "India", vibe: "High-altitude expedition", budget: "Premium", lat: 34.1526, lon: 77.577, rating: 4.9, tags: ["mountains", "roadtrip", "monasteries", "altitude"], description: "Bucket-list road routes, monastery circuits, and high-altitude planning for serious trips.", fact: "Leh sits at a high elevation and often requires acclimatization before active exploration." },
  { id: "varanasi", name: "Varanasi", state: "Uttar Pradesh", country: "India", vibe: "Spiritual immersion", budget: "Budget-friendly", lat: 25.3176, lon: 82.9739, rating: 4.7, tags: ["ghats", "spiritual", "culture", "sunrise"], description: "Riverfront rituals, old-city lanes, food trails, and intense cultural immersion.", fact: "Varanasi is often considered one of the world's oldest continuously inhabited cities." },
  { id: "rishikesh", name: "Rishikesh", state: "Uttarakhand", country: "India", vibe: "Yoga and river adventure", budget: "Budget-friendly", lat: 30.0869, lon: 78.2676, rating: 4.7, tags: ["yoga", "river", "rafting", "wellness"], description: "Ashrams, rafting, suspension bridges, and a strong wellness-meets-adventure scene.", fact: "Rishikesh is widely known as one of India's leading yoga destinations." },
  { id: "darjeeling", name: "Darjeeling", state: "West Bengal", country: "India", vibe: "Tea slopes and mountain views", budget: "Mid-range", lat: 27.041, lon: 88.2663, rating: 4.6, tags: ["tea", "hills", "toytrain", "views"], description: "Tea garden landscapes, cool weather, and slow scenic travel in the eastern Himalayas.", fact: "Darjeeling tea is globally recognized and protected as a geographical indication." },
  { id: "gangtok", name: "Gangtok", state: "Sikkim", country: "India", vibe: "Clean mountain city", budget: "Mid-range", lat: 27.3389, lon: 88.6065, rating: 4.6, tags: ["mountains", "monasteries", "clean", "views"], description: "Walkable stretches, Himalayan viewpoints, monastery visits, and gateway access to Sikkim routes.", fact: "Gangtok grew into a key hill center because of trade routes linking Sikkim and Tibet." },
  { id: "kolkata", name: "Kolkata", state: "West Bengal", country: "India", vibe: "Culture and food", budget: "Budget-friendly", lat: 22.5726, lon: 88.3639, rating: 4.4, tags: ["culture", "food", "literature", "city"], description: "Layered city itineraries with street food, colonial history, and strong local character.", fact: "Kolkata was the capital of British India until 1911." },
  { id: "hampi", name: "Hampi", state: "Karnataka", country: "India", vibe: "Ruins and boulders", budget: "Budget-friendly", lat: 15.335, lon: 76.46, rating: 4.8, tags: ["ruins", "history", "boulders", "cycling"], description: "Temple ruins, boulder landscapes, cafes, and slower backpacker-friendly exploration.", fact: "Hampi was once part of the Vijayanagara Empire, one of South India's great historical kingdoms." },
  { id: "mysuru", name: "Mysuru", state: "Karnataka", country: "India", vibe: "Palaces and calm city breaks", budget: "Mid-range", lat: 12.2958, lon: 76.6394, rating: 4.4, tags: ["palace", "culture", "food", "family"], description: "Royal architecture, clean boulevards, and easy heritage-focused weekends.", fact: "Mysuru is famous worldwide for the Dasara celebration and illuminated palace." },
  { id: "ooty", name: "Ooty", state: "Tamil Nadu", country: "India", vibe: "Classic hill station", budget: "Mid-range", lat: 11.4064, lon: 76.6932, rating: 4.5, tags: ["hills", "lake", "tea", "family"], description: "Cool weather, garden circuits, toy-train options, and easy scenic travel.", fact: "Ooty was developed as a hill retreat during British rule in the Nilgiris." },
  { id: "pondicherry", name: "Puducherry", state: "Puducherry", country: "India", vibe: "French quarter and cafes", budget: "Mid-range", lat: 11.9416, lon: 79.8083, rating: 4.5, tags: ["cafes", "beach", "architecture", "slowtravel"], description: "Seafront walks, pastel streets, cafes, and easy two- to three-day coastal itineraries.", fact: "Puducherry preserves a strong French colonial influence in its urban design and street grid." },
  { id: "hyderabad", name: "Hyderabad", state: "Telangana", country: "India", vibe: "Food and old city", budget: "Budget-friendly", lat: 17.385, lon: 78.4867, rating: 4.5, tags: ["biryani", "history", "city", "nightlife"], description: "Strong food routes, old-city landmarks, and an easy mix of heritage and modern travel.", fact: "Hyderabad was historically famed for its diamond and pearl trade." },
  { id: "new-delhi", name: "New Delhi", state: "Delhi", country: "India", vibe: "Capital city layers", budget: "Flexible", lat: 28.6139, lon: 77.209, rating: 4.4, tags: ["history", "food", "markets", "city"], description: "Monuments, food trails, museums, and strong metro-connected city travel.", fact: "New Delhi was officially inaugurated in 1931 as the capital of British India." },
  { id: "amritsar", name: "Amritsar", state: "Punjab", country: "India", vibe: "Faith and food", budget: "Budget-friendly", lat: 31.634, lon: 74.8723, rating: 4.7, tags: ["spiritual", "food", "history", "walks"], description: "Golden Temple visits, Punjabi food, and powerful border-history day plans.", fact: "The Golden Temple serves free community meals to thousands of visitors every day." },
  { id: "srinagar", name: "Srinagar", state: "Jammu and Kashmir", country: "India", vibe: "Lakes and mountains", budget: "Premium", lat: 34.0837, lon: 74.7973, rating: 4.8, tags: ["lake", "mountains", "houseboats", "scenic"], description: "Dal Lake stays, mountain backdrops, gardens, and slower scenic itineraries.", fact: "Srinagar is known for houseboats and floating markets on Dal Lake." },
  { id: "auli", name: "Auli", state: "Uttarakhand", country: "India", vibe: "Snow and views", budget: "Premium", lat: 30.5284, lon: 79.5644, rating: 4.6, tags: ["snow", "ski", "mountains", "views"], description: "Snow-season trips, mountain ropeway access, and high-viewpoint stays.", fact: "Auli is one of India's best-known skiing destinations." },
  { id: "nainital", name: "Nainital", state: "Uttarakhand", country: "India", vibe: "Lake hill station", budget: "Mid-range", lat: 29.3803, lon: 79.4636, rating: 4.5, tags: ["lake", "hills", "family", "boats"], description: "Lake-facing stays, short hill walks, and easy family-friendly planning.", fact: "Nainital grew around Naini Lake and became a major hill retreat in the colonial period." },
  { id: "ahmedabad", name: "Ahmedabad", state: "Gujarat", country: "India", vibe: "Heritage and food loops", budget: "Budget-friendly", lat: 23.0225, lon: 72.5714, rating: 4.3, tags: ["heritage", "food", "city", "culture"], description: "Old-city pols, local food routes, and a strong gateway into Gujarat travel.", fact: "Ahmedabad became India's first UNESCO World Heritage City in 2017." },
  { id: "bhuj", name: "Bhuj", state: "Gujarat", country: "India", vibe: "Craft and desert routes", budget: "Mid-range", lat: 23.242, lon: 69.6669, rating: 4.4, tags: ["craft", "desert", "culture", "roadtrip"], description: "A strong base for Kutch, white desert trips, and artisan village circuits.", fact: "Bhuj is a key gateway for exploring the Rann of Kutch region." },
  { id: "coorg", name: "Coorg", state: "Karnataka", country: "India", vibe: "Coffee hills", budget: "Mid-range", lat: 12.3375, lon: 75.8069, rating: 4.7, tags: ["coffee", "hills", "greenery", "roadtrip"], description: "Coffee-estate stays, misty drives, and relaxed hill-country breaks.", fact: "Coorg, or Kodagu, is one of India's most recognized coffee-growing regions." },
  { id: "gokarna", name: "Gokarna", state: "Karnataka", country: "India", vibe: "Quiet coast and treks", budget: "Budget-friendly", lat: 14.5479, lon: 74.3188, rating: 4.6, tags: ["beach", "trek", "sunset", "backpacker"], description: "Beach trekking, smaller crowds, and calm coastal travel compared with busier beach hubs.", fact: "Gokarna is both a pilgrimage town and a coastal backpacker favorite." },
  { id: "varkala", name: "Varkala", state: "Kerala", country: "India", vibe: "Cliffside coast", budget: "Mid-range", lat: 8.7379, lon: 76.7163, rating: 4.7, tags: ["cliffs", "beach", "cafes", "sunset"], description: "Cliff walks, sea-view cafes, and a laid-back Kerala coast experience.", fact: "Varkala is known for its dramatic cliffs overlooking the Arabian Sea." },
  { id: "madurai", name: "Madurai", state: "Tamil Nadu", country: "India", vibe: "Temple city focus", budget: "Budget-friendly", lat: 9.9252, lon: 78.1198, rating: 4.4, tags: ["temple", "culture", "food", "history"], description: "Temple-centered trips, local cuisine, and strong South India cultural depth.", fact: "Madurai is often associated with one of the world's longest continuously inhabited urban settlements." },
  { id: "shillong", name: "Shillong", state: "Meghalaya", country: "India", vibe: "Clouds and music", budget: "Mid-range", lat: 25.5788, lon: 91.8933, rating: 4.6, tags: ["hills", "music", "waterfalls", "weather"], description: "Cool hill weather, waterfall routes, and a strong youth-culture/music identity.", fact: "Shillong is often called the Scotland of the East." },
  { id: "tawang", name: "Tawang", state: "Arunachal Pradesh", country: "India", vibe: "Remote mountain monastery route", budget: "Premium", lat: 27.5861, lon: 91.8632, rating: 4.8, tags: ["monastery", "mountains", "remote", "roadtrip"], description: "Remote high-altitude drives, monastery circuits, and serious mountain planning.", fact: "Tawang Monastery is one of the largest Buddhist monasteries in India." },
  { id: "puri", name: "Puri", state: "Odisha", country: "India", vibe: "Coast and pilgrimage", budget: "Budget-friendly", lat: 19.8135, lon: 85.8312, rating: 4.5, tags: ["beach", "temple", "pilgrimage", "culture"], description: "Temple visits, beach stretches, and easy add-on routes to Konark and Bhubaneswar.", fact: "Puri is one of the four sacred Char Dham pilgrimage sites in Hindu tradition." },
  { id: "bhubaneswar", name: "Bhubaneswar", state: "Odisha", country: "India", vibe: "Temple circuit and city ease", budget: "Budget-friendly", lat: 20.2961, lon: 85.8245, rating: 4.3, tags: ["temples", "city", "history", "culture"], description: "A convenient base for Odisha temple trails, heritage stops, and coastal extensions.", fact: "Bhubaneswar is often called the Temple City because of its many historic shrines." },
  { id: "andaman", name: "Port Blair", state: "Andaman and Nicobar Islands", country: "India", vibe: "Island gateway", budget: "Premium", lat: 11.6234, lon: 92.7265, rating: 4.7, tags: ["islands", "beach", "water", "escape"], description: "The main launch point for island itineraries, beaches, and slower sea-focused travel.", fact: "Port Blair is the capital of the Andaman and Nicobar Islands and a major entry point for tourists." },
];

export const sampleTravelers: SampleTraveler[] = [
  { id: "trav-1", name: "Aisha", age: 27, city: "Mumbai", hometown: "Mumbai", destination: "Goa", budget: "Mid-range", travelStyle: "Flexible", interests: ["beach", "food", "nightlife", "culture"], travelerDNA: { socialPreference: 0.78, budgetStyle: 0.55, planningStyle: 0.45, energyLevel: 0.7 }, profilePicture: "", photos: [], prompts: [] },
  { id: "trav-2", name: "Kabir", age: 29, city: "Delhi", hometown: "Delhi", destination: "Jaipur", budget: "Budget-friendly", travelStyle: "Explorer", interests: ["culture", "food", "markets", "architecture"], travelerDNA: { socialPreference: 0.62, budgetStyle: 0.35, planningStyle: 0.6, energyLevel: 0.65 }, profilePicture: "", photos: [], prompts: [] },
  { id: "trav-3", name: "Meera", age: 25, city: "Bengaluru", hometown: "Mysuru", destination: "Kochi", budget: "Mid-range", travelStyle: "Relaxed", interests: ["cafes", "art", "heritage", "food"], travelerDNA: { socialPreference: 0.58, budgetStyle: 0.52, planningStyle: 0.55, energyLevel: 0.4 }, profilePicture: "", photos: [], prompts: [] },
  { id: "trav-4", name: "Rohan", age: 31, city: "Pune", hometown: "Pune", destination: "Lonavala", budget: "Budget-friendly", travelStyle: "Fast-paced", interests: ["hiking", "adventure", "monsoon", "roadtrip"], travelerDNA: { socialPreference: 0.7, budgetStyle: 0.42, planningStyle: 0.35, energyLevel: 0.8 }, profilePicture: "", photos: [], prompts: [] },
  { id: "trav-5", name: "Sara", age: 28, city: "Chennai", hometown: "Chennai", destination: "Pondicherry", budget: "Mid-range", travelStyle: "Relaxed", interests: ["beach", "cafes", "architecture", "photography"], travelerDNA: { socialPreference: 0.6, budgetStyle: 0.55, planningStyle: 0.65, energyLevel: 0.5 }, profilePicture: "", photos: [], prompts: [] },
  { id: "trav-6", name: "Dev", age: 30, city: "Kolkata", hometown: "Kolkata", destination: "Darjeeling", budget: "Mid-range", travelStyle: "Explorer", interests: ["tea", "hills", "photography", "culture"], travelerDNA: { socialPreference: 0.48, budgetStyle: 0.5, planningStyle: 0.5, energyLevel: 0.6 }, profilePicture: "", photos: [], prompts: [] },
];

export const sampleQuiz = [
  { id: "quiz-1", question: "Which Indian city is known as the Pink City?", options: ["Jaipur", "Mumbai", "Kochi", "Gangtok"], answer: "Jaipur" },
  { id: "quiz-2", question: "Which destination is best known for Kerala backwaters?", options: ["Alleppey", "Shimla", "Pune", "Leh"], answer: "Alleppey" },
  { id: "quiz-3", question: "Which place is famous for tea gardens in the eastern Himalayas?", options: ["Darjeeling", "Goa", "Hampi", "Hyderabad"], answer: "Darjeeling" },
  { id: "quiz-4", question: "Which city is known as the City of Lakes?", options: ["Udaipur", "Chennai", "Bhopal", "Surat"], answer: "Udaipur" },
  { id: "quiz-5", question: "Which destination is famous for its white salt desert?", options: ["Rann of Kutch", "Coorg", "Agra", "Mysuru"], answer: "Rann of Kutch" },
  { id: "quiz-6", question: "Which hill station is known for its toy train?", options: ["Shimla", "Ooty", "Manali", "Nainital"], answer: "Shimla" },
  { id: "quiz-7", question: "Which city is famous for its Portuguese-influenced architecture?", options: ["Goa", "Patna", "Indore", "Varanasi"], answer: "Goa" },
  { id: "quiz-8", question: "Which place is known for houseboat stays?", options: ["Alleppey", "Jodhpur", "Pondicherry", "Rishikesh"], answer: "Alleppey" },
  { id: "quiz-9", question: "Which destination is known for the Golden Temple?", options: ["Amritsar", "Lucknow", "Jaipur", "Kolkata"], answer: "Amritsar" },
  { id: "quiz-10", question: "Which city is known as the Queen of the Arabian Sea?", options: ["Kochi", "Pune", "Bengaluru", "Ahmedabad"], answer: "Kochi" },
  { id: "quiz-11", question: "Which state is best known for monsoon road trips to hill stations?", options: ["Maharashtra", "Punjab", "Bihar", "Odisha"], answer: "Maharashtra" },
  { id: "quiz-12", question: "Which destination is famous for palaces and lakeside sunsets?", options: ["Udaipur", "Nagpur", "Guwahati", "Ranchi"], answer: "Udaipur" },
];

export const starterNotifications = [
  { id: "notice-1", title: "Blend suggestion ready", body: "Your interests match a culture-first Jaipur weekend plan.", time: "Just now" },
  { id: "notice-2", title: "Ground trip idea", body: "Mumbai to Lonavala is trending for a short monsoon drive.", time: "5 min ago" },
  { id: "notice-3", title: "Safety reminder", body: "Enable SOS contacts before your next intercity trip.", time: "12 min ago" },
];

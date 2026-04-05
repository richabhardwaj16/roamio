import { createContext, useContext, useEffect, useState } from "react";
import { onValue, push, ref, remove, set, update } from "firebase/database";
import { realtimeDb } from "../firebase/firebase";
import { destinationCatalog, sampleQuiz, starterNotifications, sampleTravelers } from "../data/mockData";
import { backendApi } from "../services/backendApi";
import { useAuth } from "./AuthContext";

const AppDataContext = createContext(null);

function getMatchScore(userProfile, buddy) {
  let score = 0;
  const profileInterests = userProfile.interests || [];
  const overlap = (buddy.interests || []).filter((interest) => profileInterests.includes(interest));
  score += overlap.length * 18;
  if (userProfile.destination === buddy.destination) score += 25;
  if (userProfile.budget === buddy.budget) score += 20;
  if (userProfile.travelStyle === buddy.travelStyle) score += 15;
  return Math.min(score || 24, 98);
}

function emptyContacts() {
  return Array.from({ length: 5 }, (_, index) => ({
    id: String(index + 1),
    name: "Add Contact",
    phone: "",
    active: false,
  }));
}

function ensurePhotoSlots(photos) {
  if (Array.isArray(photos) && photos.length >= 6) {
    return photos.slice(0, 6);
  }

  const nextPhotos = Array(6).fill("");
  (Array.isArray(photos) ? photos : []).slice(0, 6).forEach((photo, index) => {
    nextPhotos[index] = photo || "";
  });
  return nextPhotos;
}

function ensurePromptSlots(prompts) {
  const defaults = [
    { question: "My ideal trip looks like...", answer: "" },
    { question: "The one place I'll always return to...", answer: "" },
    { question: "My travel red flag is...", answer: "" },
  ];

  if (!Array.isArray(prompts) || prompts.length === 0) {
    return defaults;
  }

  return defaults.map((fallbackPrompt, index) => ({
    ...fallbackPrompt,
    ...(prompts[index] || {}),
  }));
}

function createDefaultProfile(user) {
  const displayName = user?.displayName || user?.name || "Roamio Traveler";
  return {
    name: user?.name || displayName,
    email: user?.email || "",
    firstName: user?.firstName || displayName.split(" ")?.[0] || "",
    middleName: user?.middleName || "",
    lastName: user?.lastName || displayName.split(" ").slice(1).join(" ") || "",
    age: user?.age || "",
    gender: user?.gender || "",
    username: user?.username || user?.email?.split("@")?.[0] || "",
    religion: user?.religion || "",
    goal: user?.goal || "",
    frequency: user?.frequency || "",
    city: user?.city || "Mumbai",
    hometown: user?.hometown || user?.city || "Mumbai",
    destination: user?.destination || "Goa",
    budget: user?.budget || "Mid-range",
    travelStyle: user?.travelStyle || "Flexible",
    interests: user?.interests || user?.travelInterests || ["food", "culture", "photography"],
    visitedStates: user?.visitedStates || [],
    photos: ensurePhotoSlots(user?.photos),
    prompts: ensurePromptSlots(user?.prompts),
    travelerDNA: user?.travelerDNA || {
      budgetStyle: 0.5,
      energyLevel: 0.5,
      planningStyle: 0.5,
      socialPreference: 0.5,
    },
    bio: user?.bio || "Curates balanced trips with local food, social stays, and practical logistics.",
    sosContact: user?.sosContact || "112",
    emergencyContacts: user?.emergencyContacts || emptyContacts(),
    homeAirport: user?.homeAirport || "BOM",
    points: user?.points || 120,
    level: user?.level || "Explorer",
    profileCompleted: Boolean(user?.profileCompleted),
    profilePicture: user?.profilePicture || user?.photos?.[0] || "",
  };
}

function createPublicProfile(profileUser) {
  const profile = createDefaultProfile(profileUser);
  return {
    uid: profileUser?._id || profileUser?.firebaseUid,
    id: profileUser?._id || profileUser?.firebaseUid,
    name: profile.name,
    age: profile.age,
    city: profile.city,
    hometown: profile.hometown,
    destination: profile.destination,
    budget: profile.budget,
    travelStyle: profile.travelStyle,
    interests: profile.interests || [],
    bio: profile.bio,
    level: profile.level || "Explorer",
    photo: profile.profilePicture || profile.photos?.[0] || "",
    photos: profile.photos || [],
    prompts: profile.prompts || [],
    travelerDNA: profile.travelerDNA || {},
    profileCompleted: profile.profileCompleted,
  };
}

const samplePublicProfiles = sampleTravelers.map((traveler) =>
  createPublicProfile({ ...traveler, firebaseUid: traveler.id })
);

function buildBlendRecommendations(profile, buddies, mode = "group") {
  const targetCount = mode === "duo" ? 1 : 3;
  return buddies.slice(0, targetCount).map((buddy) => ({
    id: buddy.id,
    uid: buddy.uid,
    name: buddy.name,
    destination: buddy.destination,
    budget: buddy.budget,
    travelStyle: buddy.travelStyle,
    matchScore: buddy.matchScore,
    photo: buddy.photo || buddy.photos?.[0] || "",
  }));
}

function createSeedData(user) {
  const name = user?.displayName || user?.name || "Roamio Traveler";
  const seedMembers = [
    {
      id: "seed-member-1",
      uid: "seed-member-1",
      name: "Aisha",
      destination: "Goa",
      budget: "350 USD",
      travelStyle: "Flexible",
      matchScore: 91,
      photo: "",
    },
    {
      id: "seed-member-2",
      uid: "seed-member-2",
      name: "Kabir",
      destination: "Goa",
      budget: "350 USD",
      travelStyle: "Flexible",
      matchScore: 86,
      photo: "",
    },
  ];
  const seedTripId = "trip-1";
  const seedChatId = "blend-chat-1";

  return {
    timeline: [
      {
        id: "memory-1",
        title: "Marine Drive sunset",
        location: "Mumbai",
        note: "Saved for the next city-break moodboard.",
        date: "2026-03-01",
      },
      {
        id: "memory-2",
        title: "Weekend route draft",
        location: "Goa",
        note: "Shortlisted beaches, cafes, and airport transfers.",
        date: "2026-03-06",
      },
    ],
    notifications: starterNotifications,
    directMessages: [
      {
        id: "dm-1",
        author: name,
        text: "Planning notes are synced here in realtime.",
        time: "10:30",
      },
    ],
    reviews: [
      {
        id: "review-1",
        placeId: "goa",
        author: name,
        rating: 5,
        text: "Good for a short social trip if you book scooters in advance.",
      },
    ],
    trips: [
      {
        id: seedTripId,
        title: "Goa 3-day blend",
        destination: "Goa",
        status: "Planning",
        budget: "350 USD",
        days: 3,
        mode: "group",
        members: seedMembers,
        chatId: seedChatId,
        createdAt: new Date().toISOString(),
      },
    ],
    blendChats: [
      {
        id: seedChatId,
        tripId: seedTripId,
        title: "Goa 3-day blend",
        mode: "group",
        destination: "Goa",
        members: seedMembers,
        messages: [
          {
            id: "blend-msg-1",
            author: name,
            text: "Blend chat is ready. Start aligning transport, stay, and day plans here.",
            time: "10:45",
          },
        ],
      },
    ],
  };
}

export function AppDataProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(() => createDefaultProfile(user));
  const [appData, setAppData] = useState(null);
  const [chatLoading, setChatLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [publicProfilesLoading, setPublicProfilesLoading] = useState(true);
  const [groupChat, setGroupChat] = useState([]);
  const [publicProfiles, setPublicProfiles] = useState([]);

  useEffect(() => {
    const groupChatRef = ref(realtimeDb, "community/groupChat");
    const unsubscribe = onValue(
      groupChatRef,
      (snapshot) => {
        const value = snapshot.val();
        setGroupChat(value ? Object.values(value) : []);
        setChatLoading(false);
      },
      () => {
        setGroupChat([]);
        setChatLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function syncProfile() {
      if (!user) {
        setProfile(createDefaultProfile(user));
        setPublicProfiles(samplePublicProfiles);
        setProfileLoading(false);
        setPublicProfilesLoading(false);
        return;
      }

      setProfileLoading(true);
      setPublicProfilesLoading(true);

      try {
        const payload = {
          firebaseUid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split("@")[0] || "Roamio Traveler",
          firstName: user.displayName?.split(" ")?.[0] || "",
          lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
          profilePicture: user.photoURL || "",
        };

        const [profileResponse, discoverResponse] = await Promise.all([
          backendApi.syncFirebaseProfile(payload),
          backendApi.getDiscoverProfilesByFirebase(user.uid),
        ]);

        setProfile(createDefaultProfile(profileResponse));
        const mappedProfiles = (discoverResponse || []).map(createPublicProfile);
        setPublicProfiles(mappedProfiles.length > 0 ? mappedProfiles : samplePublicProfiles);
      } catch {
        setProfile(createDefaultProfile(user));
        setPublicProfiles(samplePublicProfiles);
      } finally {
        setProfileLoading(false);
        setPublicProfilesLoading(false);
      }
    }

    syncProfile();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setAppData(null);
      return;
    }

    const userRef = ref(realtimeDb, `users/${user.uid}`);

    const unsubscribe = onValue(
      userRef,
      async (snapshot) => {
        const value = snapshot.val();
        if (!value) {
          const seed = createSeedData(user);
          await set(userRef, seed);
          setAppData(seed);
        } else {
          setAppData(value);
        }
      },
      async () => {
        const seed = createSeedData(user);
        setAppData(seed);
        await set(userRef, seed);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const scopedAppData = user ? appData : null;
  const appDataLoading = Boolean(user) && scopedAppData === null;

  const matchedBuddies = publicProfiles
    .filter((buddy) => buddy.uid !== user?.uid)
    .map((buddy) => ({ ...buddy, matchScore: getMatchScore(profile, buddy) }))
    .sort((a, b) => b.matchScore - a.matchScore);
  const currentPublicProfile = createPublicProfile({ ...profile, firebaseUid: user?.uid });
  const allProfiles = [currentPublicProfile, ...publicProfiles].filter(
    (candidate, index, list) => list.findIndex((item) => item.uid === candidate.uid) === index
  );

  const destinationReviews = destinationCatalog.map((destination) => ({
    ...destination,
    reviews: (scopedAppData?.reviews || []).filter((review) => review.placeId === destination.id),
  }));

  const value = {
    loading: (user ? appDataLoading || publicProfilesLoading || profileLoading : false) || chatLoading,
    profile,
    timeline: scopedAppData?.timeline || [],
    notifications: scopedAppData?.notifications || starterNotifications,
    directMessages: scopedAppData?.directMessages || [],
    reviews: scopedAppData?.reviews || [],
    trips: scopedAppData?.trips || [],
    blendChats: scopedAppData?.blendChats || [],
    buddies: matchedBuddies,
    allProfiles,
    destinations: destinationReviews,
    quiz: sampleQuiz,
    groupChat,
    hasBuddyMatches: matchedBuddies.length > 0,
    async updateProfileDetails(nextProfile) {
      if (!user) return;

      const nextValue = {
        ...profile,
        ...nextProfile,
        profilePicture:
          nextProfile.profilePicture ||
          nextProfile.photos?.find?.(Boolean) ||
          profile.profilePicture ||
          profile.photos?.[0] ||
          "",
        profileCompleted:
          nextProfile.profileCompleted !== undefined
            ? nextProfile.profileCompleted
            : profile.profileCompleted,
      };

      setProfile(nextValue);

      const updatedProfile = await backendApi.updateFirebaseProfile(user.uid, {
        ...nextValue,
        interests: nextValue.interests,
        travelInterests: nextValue.interests,
        photos: nextValue.photos,
      });

      setProfile(createDefaultProfile(updatedProfile));

      const discoverResponse = await backendApi.getDiscoverProfilesByFirebase(user.uid);
      setPublicProfiles(discoverResponse.map(createPublicProfile));
    },
    async addTimelineMemory(memory) {
      if (!user) return;
      const nextMemory = { id: `memory-${Date.now()}`, ...memory };
      const nextTimeline = [nextMemory, ...(scopedAppData?.timeline || [])];
      setAppData((current) => ({ ...current, timeline: nextTimeline }));
      await update(ref(realtimeDb, `users/${user.uid}`), { timeline: nextTimeline });
    },
    async addReview(review) {
      if (!user) return;
      const nextReview = { id: `review-${Date.now()}`, author: profile.name, ...review };
      const nextReviews = [nextReview, ...(scopedAppData?.reviews || [])];
      setAppData((current) => ({ ...current, reviews: nextReviews }));
      await update(ref(realtimeDb, `users/${user.uid}`), { reviews: nextReviews });
    },
    async addTrip(trip) {
      if (!user) return;
      const nextTrip = { id: `trip-${Date.now()}`, ...trip };
      const nextTrips = [nextTrip, ...(scopedAppData?.trips || [])];
      setAppData((current) => ({ ...current, trips: nextTrips }));
      await update(ref(realtimeDb, `users/${user.uid}`), { trips: nextTrips });
    },
    async createBlend(trip, mode = "group") {
      if (!user) return null;

      const recommendedMembers = buildBlendRecommendations(profile, matchedBuddies, mode);
      const timestamp = Date.now();
      const tripId = `trip-${timestamp}`;
      const chatId = `blend-chat-${timestamp}`;
      const nextTrip = {
        id: tripId,
        ...trip,
        mode,
        members: recommendedMembers,
        chatId,
        createdAt: new Date(timestamp).toISOString(),
      };
      const nextTrips = [nextTrip, ...(scopedAppData?.trips || [])];
      const nextChat = {
        id: chatId,
        tripId,
        title: nextTrip.title || `${nextTrip.destination} blend`,
        mode,
        destination: nextTrip.destination,
        members: recommendedMembers,
        messages: [
          {
            id: `blend-msg-${timestamp}`,
            author: profile.name,
            text:
              recommendedMembers.length > 0
                ? `Blend created with ${recommendedMembers.map((member) => member.name).join(", ")}.`
                : "Blend created. Invite-ready recommendations will appear when more matches are available.",
            time: new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      };
      const nextBlendChats = [nextChat, ...(scopedAppData?.blendChats || [])];

      setAppData((current) => ({
        ...current,
        trips: nextTrips,
        blendChats: nextBlendChats,
      }));
      await update(ref(realtimeDb, `users/${user.uid}`), {
        trips: nextTrips,
        blendChats: nextBlendChats,
      });

      return nextChat;
    },
    async sendDirectMessage(text, target) {
      if (!user || !text.trim()) return;
      const nextMessage = {
        id: `dm-${Date.now()}`,
        author: profile.name,
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        toId: target?.id || null,
        toName: target?.name || null,
      };
      const nextMessages = [...(scopedAppData?.directMessages || []), nextMessage];
      setAppData((current) => ({ ...current, directMessages: nextMessages }));
      await update(ref(realtimeDb, `users/${user.uid}`), { directMessages: nextMessages });
    },
    async sendGroupMessage(text) {
      if (!user || !text.trim()) return;
      const message = {
        id: `group-${Date.now()}`,
        author: profile.name,
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      await push(ref(realtimeDb, "community/groupChat"), message);
    },
    async sendBlendMessage(chatId, text) {
      if (!user || !text.trim()) return;

      const nextMessages = (scopedAppData?.blendChats || []).map((chat) => {
        if (chat.id !== chatId) return chat;

        const message = {
          id: `blend-${Date.now()}`,
          author: profile.name,
          text: text.trim(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        return {
          ...chat,
          messages: [...(chat.messages || []), message],
        };
      });

      setAppData((current) => ({ ...current, blendChats: nextMessages }));
      await update(ref(realtimeDb, `users/${user.uid}`), { blendChats: nextMessages });
    },
    async dismissNotification(id) {
      if (!user) return;
      const nextNotifications = (scopedAppData?.notifications || []).filter((item) => item.id !== id);
      setAppData((current) => ({ ...current, notifications: nextNotifications }));
      await update(ref(realtimeDb, `users/${user.uid}`), { notifications: nextNotifications });
    },
    async triggerSosAlert() {
      if (!user) return;
      const alertRef = ref(realtimeDb, `alerts/${user.uid}`);
      await set(alertRef, {
        name: profile.name,
        destination: profile.destination,
        contact: profile.sosContact,
        emergencyContacts: profile.emergencyContacts || [],
        createdAt: new Date().toISOString(),
      });
      const nextNotifications = [
        {
          id: `notice-${Date.now()}`,
          title: "SOS alert sent",
          body: `Emergency signal sent with ${profile.destination} destination context.`,
          time: "Now",
        },
        ...(scopedAppData?.notifications || []),
      ];
      setAppData((current) => ({ ...current, notifications: nextNotifications }));
      await update(ref(realtimeDb, `users/${user.uid}`), { notifications: nextNotifications });
    },
    async clearCommunityChat() {
      await remove(ref(realtimeDb, "community/groupChat"));
    },
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return context;
}

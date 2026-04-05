import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onValue, push, ref, remove, set } from "firebase/database";
import { backendApi, BackendUser } from "../services/backend";
import { realtimeDb } from "../firebase/firebase";
import { useAuth } from "./AuthContext";
import { readJson, writeJson } from "../utils/storage";
import { destinationCatalog, sampleTravelers, starterNotifications } from "../data/mockData";

type Message = {
  id: string;
  author: string;
  authorId?: string;
  text: string;
  time: string;
  createdAt?: number;
  toId?: string | null;
  toName?: string | null;
};

type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
};

type Review = {
  id: string;
  placeId: string;
  author: string;
  rating: number;
  text: string;
  createdAt?: number;
};

type DestinationWithReviews = (typeof destinationCatalog)[number] & {
  reviews: Review[];
};

type BlendChat = {
  id: string;
  tripId: string;
  title: string;
  mode: "duo" | "group";
  destination: string;
  members: PublicProfile[];
  messages: Message[];
};

type Trip = {
  id: string;
  title: string;
  destination: string;
  status: string;
  budget: string;
  days: number;
  mode: "duo" | "group";
  members: PublicProfile[];
  chatId: string;
  createdAt: string;
};

type LocalState = {
  notifications: Notification[];
  directMessages: Message[];
  groupChat: Message[];
  trips: Trip[];
  blendChats: BlendChat[];
  reviews: Review[];
};

type DailyMission = {
  id: string;
  title: string;
  action: string;
  target: number;
  progress: number;
  rewardXp: number;
  completed: boolean;
  rewarded?: boolean;
};

export type PublicProfile = {
  id: string;
  name: string;
  username: string;
  age: string;
  bio: string;
  hobby: string;
  city: string;
  hometown: string;
  destination: string;
  budget: string;
  travelStyle: string;
  interests: string[];
  prompts: { question: string; answer: string }[];
  photos: string[];
  photo: string;
  travelerDNA: {
    budgetStyle: number;
    energyLevel: number;
    planningStyle: number;
    socialPreference: number;
  };
  level: string;
  xp: number;
  points: number;
  badges: string[];
  streak: number;
  dailyMissions: DailyMission[];
  matchScore?: number;
  profileCompleted: boolean;
};

type EditableProfile = {
  name: string;
  age: string;
  username: string;
  gender: string;
  religion: string;
  goal: string;
  frequency: string;
  hobby: string;
  hometown: string;
  city: string;
  destination: string;
  budget: string;
  travelStyle: string;
  bio: string;
  interests: string[];
  visitedStates: string[];
  prompts: { question: string; answer: string }[];
  travelerDNA: {
    budgetStyle: number;
    energyLevel: number;
    planningStyle: number;
    socialPreference: number;
  };
  photos: string[];
  profilePicture: string;
  xp: number;
  points: number;
  level: string;
  badges: string[];
  streak: number;
  dailyMissions: DailyMission[];
  sosContact: string;
  emergencyContacts: { id: string; name: string; phone: string; active: boolean }[];
  profileCompleted: boolean;
};

type AppDataContextValue = {
  loading: boolean;
  profile: EditableProfile;
  buddies: PublicProfile[];
  allProfiles: PublicProfile[];
  destinations: DestinationWithReviews[];
  notifications: Notification[];
  directMessages: Message[];
  getDirectMessagesForUser: (userId?: string | null) => Message[];
  getProfileById: (id?: string | null) => PublicProfile | null;
  groupChat: Message[];
  trips: Trip[];
  blendChats: BlendChat[];
  recordGamificationAction: (
    action: "daily_login" | "blend_match" | "post_memory" | "complete_quiz" | "add_place"
  ) => Promise<{
    xpGained: number;
    unlockedBadges: string[];
    streak: number;
    streakBonusXp: number;
    leveledUp: boolean;
    level: string;
    nextLevelThreshold: { level: string; minXp: number } | null;
  } | null>;
  updateProfileDetails: (payload: Partial<EditableProfile>) => Promise<void>;
  createBlend: (
    trip: Omit<Trip, "id" | "members" | "chatId" | "createdAt" | "mode">,
    mode: "duo" | "group",
    options?: { members?: PublicProfile[] }
  ) => Promise<BlendChat | null>;
  addReview: (payload: { placeId: string; rating: number; text: string }) => Promise<void>;
  sendDirectMessage: (text: string, target?: { id: string; name: string } | null) => Promise<void>;
  sendGroupMessage: (text: string) => Promise<void>;
  sendBlendMessage: (chatId: string, text: string) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  triggerSosAlert: () => Promise<void>;
  clearCommunityChat: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);
const DEFAULT_PROFILE_INTERESTS = ["food", "culture", "photography"];
const MAX_NOTES_MESSAGES = 50;

function emptyContacts() {
  return Array.from({ length: 5 }, (_, index) => ({
    id: String(index + 1),
    name: "Add Contact",
    phone: "",
    active: false,
  }));
}

function ensurePhotoSlots(photos?: string[]) {
  const next = Array(6).fill("");
  (photos || []).slice(0, 6).forEach((item, index) => {
    next[index] = item || "";
  });
  return next;
}

function ensurePromptSlots(prompts?: { question: string; answer: string }[]) {
  const defaults = [
    { question: "My ideal trip looks like...", answer: "" },
    { question: "The one place I'll always return to...", answer: "" },
    { question: "My travel red flag is...", answer: "" },
  ];

  return defaults.map((item, index) => ({
    ...item,
    ...(prompts?.[index] || {}),
  }));
}

function normalizeInterests(interests?: string[], travelInterests?: string[]) {
  const source = interests?.length ? interests : travelInterests?.length ? travelInterests : [];
  return source.filter((item) => !DEFAULT_PROFILE_INTERESTS.includes(item));
}

function createProfile(user?: BackendUser | null): EditableProfile {
  return {
    name: user?.name || "Roamio Traveler",
    age: String(user?.age || ""),
    username: user?.username || user?.email?.split("@")[0] || "traveler",
    gender: user?.gender || "",
    religion: user?.religion || "",
    goal: user?.goal || "Travel Buddy",
    frequency: user?.frequency || "Every few months",
    hobby: user?.hobby || "",
    hometown: user?.hometown || user?.city || "Mumbai",
    city: user?.city || user?.hometown || "Mumbai",
    destination: user?.destination || "Goa",
    budget: user?.budget || "Mid-range",
    travelStyle: user?.travelStyle || "Flexible",
    bio: user?.bio || "Curates city breaks, food stops, and practical trip plans.",
    interests: normalizeInterests(user?.interests, user?.travelInterests),
    visitedStates: user?.visitedStates || [],
    prompts: ensurePromptSlots(user?.prompts),
    travelerDNA: {
      budgetStyle: user?.travelerDNA?.budgetStyle ?? 0.5,
      energyLevel: user?.travelerDNA?.energyLevel ?? 0.5,
      planningStyle: user?.travelerDNA?.planningStyle ?? 0.5,
      socialPreference: user?.travelerDNA?.socialPreference ?? 0.5,
    },
    photos: ensurePhotoSlots(user?.photos),
    profilePicture: user?.profilePicture || user?.photos?.[0] || "",
    xp: user?.xp || 0,
    points: user?.points ?? user?.xp ?? 0,
    level: user?.level || "Explorer",
    badges: user?.badges || [],
    streak: user?.streak || 0,
    dailyMissions: user?.dailyMissions || [],
    sosContact: user?.sosContact || "112",
    emergencyContacts: user?.emergencyContacts?.length ? user.emergencyContacts : emptyContacts(),
    profileCompleted: Boolean(user?.profileCompleted),
  };
}

function createPublicProfile(user?: BackendUser | null): PublicProfile {
  const profile = createProfile(user);
  return {
    id: user?._id || `local-${profile.username}`,
    name: profile.name,
    username: profile.username,
    age: profile.age,
    bio: profile.bio,
    hobby: profile.hobby,
    city: profile.city,
    hometown: profile.hometown,
    destination: profile.destination,
    budget: profile.budget,
    travelStyle: profile.travelStyle,
    interests: profile.interests,
    prompts: profile.prompts,
    photos: profile.photos,
    photo: profile.profilePicture || profile.photos[0] || "",
    travelerDNA: profile.travelerDNA,
    level: profile.level,
    xp: profile.xp,
    points: profile.points,
    badges: profile.badges,
    streak: profile.streak,
    dailyMissions: profile.dailyMissions,
    profileCompleted: profile.profileCompleted,
  };
}

function normalizeUsername(profile: PublicProfile) {
  return profile.username || profile.name.toLowerCase().replace(/\s+/g, "");
}

function buildDirectThreadKey(userA: string, userB: string) {
  return [userA, userB].sort().join("__");
}

const MAX_BLEND_MESSAGES = 20;

function compactMembers(members: PublicProfile[]) {
  return members.map((member) => ({
    id: member.id,
    name: member.name,
    matchScore: member.matchScore,
  }));
}

function compactTrips(trips: Trip[]) {
  return trips.map((trip) => ({
    id: trip.id,
    title: trip.title,
    destination: trip.destination,
    status: trip.status,
    budget: trip.budget,
    days: trip.days,
    mode: trip.mode,
    chatId: trip.chatId,
    createdAt: trip.createdAt,
    members: compactMembers(trip.members || []),
  }));
}

function compactBlendChats(chats: BlendChat[]) {
  return chats.map((chat) => ({
    id: chat.id,
    tripId: chat.tripId,
    title: chat.title,
    mode: chat.mode,
    destination: chat.destination,
    members: compactMembers(chat.members || []),
    messages: (chat.messages || []).slice(-MAX_BLEND_MESSAGES),
  }));
}

function matchScore(profile: EditableProfile, buddy: PublicProfile) {
  const myInterests = profile.interests || [];
  const overlap = (buddy.interests || []).filter((item) => myInterests.includes(item)).length;
  let score = overlap * 18;
  if (profile.destination === buddy.destination) score += 24;
  if (profile.budget === buddy.budget) score += 18;
  if (profile.travelStyle === buddy.travelStyle) score += 14;
  return Math.max(24, Math.min(98, score));
}

function localSeed(name: string): LocalState {
  return {
    notifications: starterNotifications,
    directMessages: [
      {
        id: "dm-1",
        author: name,
        authorId: "self",
        text: "Your trip notes and blend threads live here on mobile now.",
        time: "10:30",
        toId: "notes",
        toName: "Direct Notes",
      },
    ],
    groupChat: [
      {
        id: "group-1",
        author: "Roamio AI",
        text: "Community room is open. Share routes, food tips, and live updates.",
        time: "10:40",
      },
    ],
    trips: [],
    blendChats: [],
    reviews: [
      {
        id: "review-1",
        placeId: "goa",
        author: name,
        rating: 5,
        text: "Great for a short social trip if you lock in scooters and sunset spots early.",
      },
    ],
  };
}

function sampleTravelerProfiles(): PublicProfile[] {
  return sampleTravelers.map((traveler, index) => ({
    id: traveler.id,
    name: traveler.name,
    username: traveler.name.toLowerCase(),
    age: String(traveler.age),
    bio: `${traveler.name} is into ${traveler.interests.slice(0, 2).join(" and ")} trips.`,
    hobby: "",
    city: traveler.city,
    hometown: traveler.hometown,
    destination: traveler.destination,
    budget: traveler.budget,
    travelStyle: traveler.travelStyle,
    interests: traveler.interests,
    prompts: traveler.prompts,
    photos: traveler.photos,
    photo: traveler.profilePicture || traveler.photos[0] || "",
    travelerDNA: {
      budgetStyle: traveler.travelerDNA.budgetStyle,
      energyLevel: traveler.travelerDNA.energyLevel,
      planningStyle: traveler.travelerDNA.planningStyle,
      socialPreference: traveler.travelerDNA.socialPreference,
    },
    level: index % 2 === 0 ? "Explorer" : "Nomad",
    xp: 120 + index * 25,
    points: 120 + index * 25,
    badges: [],
    streak: 0,
    dailyMissions: [],
    profileCompleted: true,
  }));
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const { token, user, loading: authLoading, updateUser } = useAuth();
  const [profile, setProfile] = useState<EditableProfile>(() => createProfile(user));
  const [discover, setDiscover] = useState<PublicProfile[]>([]);
  const [localState, setLocalState] = useState<LocalState>(() => localSeed("Roamio Traveler"));
  const [loading, setLoading] = useState(true);
  const fallbackDiscover = useMemo(() => sampleTravelerProfiles(), []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!token || !user?._id) {
        setProfile(createProfile(user));
        setDiscover([]);
        setLocalState(localSeed(user?.name || "Roamio Traveler"));
        setLoading(false);
        return;
      }

      setLoading(true);
      const optimisticProfile = createProfile(user);
      setProfile(optimisticProfile);

      try {
        const storageKey = `roamio.mobile.local.${user._id}`;
        const stored = await readJson<LocalState | null>(storageKey, null);
        const nextLocal = stored || localSeed(user.name || "Roamio Traveler");

        if (!mounted) return;
        setLocalState(nextLocal);
        setLoading(false);

        const [remoteProfile, discoverProfiles] = await Promise.all([
          backendApi.getProfile(token),
          backendApi.getDiscoverProfiles(token),
        ]);

        if (!mounted) return;
        setProfile(createProfile(remoteProfile));
        const nextDiscover = discoverProfiles.map(createPublicProfile);
        setDiscover(nextDiscover.length > 0 ? nextDiscover : fallbackDiscover);
      } catch {
        if (!mounted) return;
        setProfile(createProfile(user));
        setDiscover(fallbackDiscover);
        setLocalState(localSeed(user.name || "Roamio Traveler"));
        setLoading(false);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [fallbackDiscover, token, user]);

  useEffect(() => {
    async function persist() {
      if (!user?._id) return;
      await writeJson(`roamio.mobile.local.${user._id}`, localState);
    }

    persist();
  }, [localState, user?._id]);

  useEffect(() => {
    const groupChatRef = ref(realtimeDb, "community/groupChat");

    const unsubscribe = onValue(
      groupChatRef,
      (snapshot) => {
        const value = snapshot.val();
        const nextMessages = value ? (Object.values(value) as Message[]) : [];
        setLocalState((current) => ({ ...current, groupChat: nextMessages }));
      },
      () => {
        // Keep local group chat if Firebase is unavailable.
      }
    );

    return () => unsubscribe();
  }, []);

  const buddies = useMemo(
    () =>
      (discover.length > 0 ? discover : fallbackDiscover)
        .map((item) => ({ ...item, matchScore: matchScore(profile, item) }))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)),
    [discover, fallbackDiscover, profile]
  );

  const allProfiles = useMemo(
    () => [createPublicProfile(user), ...(discover.length > 0 ? discover : fallbackDiscover)],
    [discover, fallbackDiscover, user]
  );
  const destinations = useMemo<DestinationWithReviews[]>(
    () =>
      destinationCatalog.map((destination) => ({
        ...destination,
        reviews: localState.reviews.filter((review) => review.placeId === destination.id),
      })),
    [localState.reviews]
  );
  const currentProfileId = allProfiles[0]?.id || "self";

  const getProfileById = useCallback((id?: string | null) => {
    if (!id) return null;
    return allProfiles.find((item) => item.id === id) || null;
  }, [allProfiles]);

  const getDirectMessagesForUser = useCallback((userId?: string | null) => {
    if (!userId || userId === "notes") {
      return localState.directMessages.filter((message) => !message.toId || message.toId === "notes");
    }

    return localState.directMessages.filter(
      (message) =>
        message.toId === userId ||
        (message.authorId === userId && (message.toId === currentProfileId || !message.toId))
    );
  }, [currentProfileId, localState.directMessages]);

  useEffect(() => {
    if (!currentProfileId || currentProfileId === "self") return;

    const directChatRef = ref(realtimeDb, "directChats");
    const unsubscribe = onValue(
      directChatRef,
      (snapshot) => {
        const value = snapshot.val() as
          | Record<
              string,
              {
                participants?: Record<string, { name?: string }>;
                messages?: Record<string, Message>;
              }
            >
          | null;

        const remoteMessages = Object.entries(value || {})
          .filter(([threadKey]) => threadKey.split("__").includes(currentProfileId))
          .flatMap(([, thread]) => {
            const participants = thread.participants || {};
            const otherId = Object.keys(participants).find((participantId) => participantId !== currentProfileId) || null;
            const otherName = otherId ? participants[otherId]?.name || "Traveler" : "Traveler";

            return Object.values(thread.messages || {}).map((message) => ({
              ...message,
              toId: message.authorId === currentProfileId ? otherId : currentProfileId,
              toName: message.authorId === currentProfileId ? otherName : profile.name,
            }));
          })
          .sort((left, right) => (left.createdAt || 0) - (right.createdAt || 0));

        setLocalState((current) => {
          const notes = current.directMessages.filter((message) => !message.toId || message.toId === "notes");
          return {
            ...current,
            directMessages: [...notes, ...remoteMessages],
          };
        });
      },
      () => {
        // Keep the current local direct threads if Firebase is unavailable.
      }
    );

    return () => unsubscribe();
  }, [currentProfileId, profile.name]);

  useEffect(() => {
    if (!currentProfileId || currentProfileId === "self") return;

    const notesRef = ref(realtimeDb, `mobileUsers/${currentProfileId}/notes`);
    const unsubscribe = onValue(
      notesRef,
      (snapshot) => {
        const value = snapshot.val() as Record<string, Message> | null;
        const notes = Object.entries(value || {})
          .map(([key, message]) => ({
            ...message,
            id: message.id || key,
            toId: "notes",
            toName: "Direct Notes",
          }))
          .sort((left, right) => (left.createdAt || 0) - (right.createdAt || 0));

        const limited = notes.slice(-MAX_NOTES_MESSAGES);

        setLocalState((current) => {
          const nonNotes = current.directMessages.filter((message) => message.toId && message.toId !== "notes");
          return {
            ...current,
            directMessages: [...limited, ...nonNotes],
          };
        });

        if (notes.length > MAX_NOTES_MESSAGES) {
          const excess = notes.slice(0, notes.length - MAX_NOTES_MESSAGES);
          excess.forEach((note) => {
            void remove(ref(realtimeDb, `mobileUsers/${currentProfileId}/notes/${note.id}`));
          });
        }
      },
      () => {
        // Keep local notes if Firebase is unavailable.
      }
    );

    return () => unsubscribe();
  }, [currentProfileId]);

  useEffect(() => {
    const reviewsRef = ref(realtimeDb, "placeReviews");
    const unsubscribe = onValue(
      reviewsRef,
      (snapshot) => {
        const value = snapshot.val() as Record<string, Review> | null;
        const nextReviews = Object.values(value || {}).sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0));
        setLocalState((current) => ({
          ...current,
          reviews: nextReviews.length > 0 ? nextReviews : current.reviews,
        }));
      },
      () => {
        // Keep local reviews if Firebase is unavailable.
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentProfileId || currentProfileId === "self") return;

    const blendStateRef = ref(realtimeDb, `mobileUsers/${currentProfileId}/blendState`);
    const unsubscribe = onValue(
      blendStateRef,
      (snapshot) => {
        const value = snapshot.val() as { trips?: Trip[]; blendChats?: BlendChat[] } | null;
        if (!value) return;

        setLocalState((current) => ({
          ...current,
          trips: value.trips || current.trips,
          blendChats: value.blendChats || current.blendChats,
        }));
      },
      () => {
        // Keep local blend state if Firebase is unavailable.
      }
    );

    return () => unsubscribe();
  }, [currentProfileId]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      loading: authLoading || loading,
      profile,
      buddies,
      allProfiles,
      destinations,
      notifications: localState.notifications,
      directMessages: localState.directMessages,
      getDirectMessagesForUser,
      getProfileById,
      groupChat: localState.groupChat,
      trips: localState.trips,
      blendChats: localState.blendChats,
      async recordGamificationAction(action) {
        if (!token) return null;
        const response = await backendApi.recordGamificationAction(token, action);
        const hydrated = createProfile(response.user);
        setProfile(hydrated);
        updateUser(response.user);
        return response.result;
      },
      async updateProfileDetails(payload) {
        if (!token) return;

        const nextProfile = {
          ...profile,
          ...payload,
          photos: ensurePhotoSlots(payload.photos || profile.photos),
          prompts: ensurePromptSlots(payload.prompts || profile.prompts),
          profilePicture:
            payload.profilePicture ||
            payload.photos?.find(Boolean) ||
            profile.profilePicture ||
            profile.photos[0] ||
            "",
        };

        setProfile(nextProfile);
        const updated = await backendApi.updateProfile(token, {
          name: nextProfile.name,
          age: nextProfile.age ? Number(nextProfile.age) : undefined,
          username: nextProfile.username,
          gender: nextProfile.gender,
          religion: nextProfile.religion,
          goal: nextProfile.goal,
          frequency: nextProfile.frequency,
          hobby: nextProfile.hobby,
          hometown: nextProfile.hometown,
          city: nextProfile.city,
          destination: nextProfile.destination,
          budget: nextProfile.budget,
          travelStyle: nextProfile.travelStyle,
          bio: nextProfile.bio,
          interests: nextProfile.interests,
          travelInterests: nextProfile.interests,
          visitedStates: nextProfile.visitedStates,
          prompts: nextProfile.prompts,
          travelerDNA: nextProfile.travelerDNA,
          photos: nextProfile.photos.filter(Boolean),
          profilePicture: nextProfile.profilePicture,
          sosContact: nextProfile.sosContact,
          emergencyContacts: nextProfile.emergencyContacts,
          profileCompleted: nextProfile.profileCompleted,
        });

        const hydrated = createProfile({
          ...updated,
          hobby: updated.hobby ?? nextProfile.hobby,
        });
        setProfile(hydrated);
        updateUser({
          ...updated,
          hobby: updated.hobby ?? nextProfile.hobby,
        });
      },
      async createBlend(trip, mode, options) {
        const members = (options?.members || buddies.slice(0, mode === "duo" ? 1 : 3)).slice(
          0,
          mode === "duo" ? 1 : 3
        );
        const stamp = Date.now();
        const chatId = `blend-chat-${stamp}`;
        const nextTrip: Trip = {
          ...trip,
          id: `trip-${stamp}`,
          mode,
          members,
          chatId,
          createdAt: new Date(stamp).toISOString(),
        };

        const nextChat: BlendChat = {
          id: chatId,
          tripId: nextTrip.id,
          title: nextTrip.title,
          mode,
          destination: nextTrip.destination,
          members,
          messages: [
            {
              id: `blend-msg-${stamp}`,
              author: profile.name,
              text:
                members.length > 0
                  ? `Blend ready with ${members.map((member) => member.name).join(", ")}.`
                  : "Blend created. Waiting for more compatible travelers.",
              time: new Date(stamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ],
        };

        const nextTrips = [nextTrip, ...localState.trips];
        const nextBlendChats = [nextChat, ...localState.blendChats];

        setLocalState((current) => ({
          ...current,
          trips: nextTrips,
          blendChats: nextBlendChats,
        }));

        if (currentProfileId && currentProfileId !== "self") {
          try {
            const firebaseTrips = compactTrips(nextTrips);
            const firebaseBlendChats = compactBlendChats(nextBlendChats);
            await set(ref(realtimeDb, `mobileUsers/${currentProfileId}/blendState`), {
              trips: firebaseTrips,
              blendChats: firebaseBlendChats,
            });
          } catch {
            // Local state above still keeps the feature usable offline.
          }
        }

        if (token) {
          try {
            const response = await backendApi.recordGamificationAction(token, "blend_match");
            const hydrated = createProfile(response.user);
            setProfile(hydrated);
            updateUser(response.user);
          } catch {
            // Blend creation still succeeds locally if gamification sync fails.
          }
        }

        return nextChat;
      },
      async addReview(payload) {
        const stamp = Date.now();
        const nextReview: Review = {
          id: `review-${stamp}`,
          placeId: payload.placeId,
          rating: payload.rating,
          text: payload.text.trim(),
          author: profile.name,
          createdAt: stamp,
        };

        if (!nextReview.text) return;

        setLocalState((current) => ({
          ...current,
          reviews: [nextReview, ...current.reviews],
        }));

        try {
          await set(ref(realtimeDb, `placeReviews/${nextReview.id}`), nextReview);
        } catch {
          // Local state above still shows the submitted review.
        }

        if (token) {
          try {
            const response = await backendApi.recordGamificationAction(token, "add_place");
            const hydrated = createProfile(response.user);
            setProfile(hydrated);
            updateUser(response.user);
          } catch {
            // Review remains saved locally even if gamification sync fails.
          }
        }
      },
      async sendDirectMessage(text, target) {
        const trimmed = text.trim();
        if (!trimmed) return;

        const stamp = Date.now();
        const next: Message = {
          id: `dm-${stamp}`,
          author: profile.name,
          authorId: currentProfileId,
          text: trimmed,
          time: new Date(stamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          createdAt: stamp,
          toId: target?.id || "notes",
          toName: target?.name || "Direct Notes",
        };

        if (!target?.id || target.id === "notes") {
          setLocalState((current) => ({
            ...current,
            directMessages: [...current.directMessages, next],
          }));
          if (currentProfileId && currentProfileId !== "self") {
            try {
              await push(ref(realtimeDb, `mobileUsers/${currentProfileId}/notes`), next);
            } catch {
              // Keep local copy if Firebase is unavailable.
            }
          }
          return;
        }

        const threadKey = buildDirectThreadKey(currentProfileId, target.id);

        try {
          await set(ref(realtimeDb, `directChats/${threadKey}/participants/${currentProfileId}`), {
            name: profile.name,
            username: normalizeUsername(createPublicProfile(user)),
          });
          await set(ref(realtimeDb, `directChats/${threadKey}/participants/${target.id}`), {
            name: target.name,
          });
          await push(ref(realtimeDb, `directChats/${threadKey}/messages`), next);
          await set(ref(realtimeDb, `directChats/${threadKey}/updatedAt`), stamp);
        } catch {
          setLocalState((current) => ({
            ...current,
            directMessages: [...current.directMessages, next],
          }));
        }
      },
      async sendGroupMessage(text) {
        const next: Message = {
          id: `group-${Date.now()}`,
          author: profile.name,
          text: text.trim(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        try {
          await push(ref(realtimeDb, "community/groupChat"), next);
        } catch {
          setLocalState((current) => ({
            ...current,
            groupChat: [...current.groupChat, next],
          }));
        }

        if (token) {
          try {
            const response = await backendApi.recordGamificationAction(token, "post_memory");
            const hydrated = createProfile(response.user);
            setProfile(hydrated);
            updateUser(response.user);
          } catch {
            // Message still posts even if gamification sync fails.
          }
        }
      },
      async sendBlendMessage(chatId, text) {
        const trimmed = text.trim();
        if (!trimmed) return;

        const nextBlendChats = localState.blendChats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    id: `blend-${Date.now()}`,
                    author: profile.name,
                    text: trimmed,
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ],
              }
            : chat
        );

        setLocalState((current) => ({
          ...current,
          blendChats: nextBlendChats,
        }));

        if (currentProfileId && currentProfileId !== "self") {
          try {
            const firebaseTrips = compactTrips(localState.trips);
            const firebaseBlendChats = compactBlendChats(nextBlendChats);
            await set(ref(realtimeDb, `mobileUsers/${currentProfileId}/blendState`), {
              trips: firebaseTrips,
              blendChats: firebaseBlendChats,
            });
          } catch {
            // Local state above still keeps the feature usable offline.
          }
        }
      },
      async dismissNotification(id) {
        setLocalState((current) => ({
          ...current,
          notifications: current.notifications.filter((item) => item.id !== id),
        }));
      },
      async triggerSosAlert() {
        try {
          await set(ref(realtimeDb, `alerts/${user?._id || "guest"}`), {
            name: profile.name,
            destination: profile.destination,
            contact: profile.sosContact,
            emergencyContacts: profile.emergencyContacts,
            createdAt: new Date().toISOString(),
          });
        } catch {
          // Notifications below still provide a local confirmation path.
        }

        setLocalState((current) => ({
          ...current,
          notifications: [
            {
              id: `notice-${Date.now()}`,
              title: "SOS alert sent",
              body: `Emergency signal prepared for ${profile.destination} and ${profile.sosContact}.`,
              time: "Now",
            },
            ...current.notifications,
          ],
        }));
      },
      async clearCommunityChat() {
        try {
          await remove(ref(realtimeDb, "community/groupChat"));
        } catch {
          setLocalState((current) => ({
            ...current,
            groupChat: [],
          }));
        }
      },
    }),
    [
      allProfiles,
      authLoading,
      buddies,
      currentProfileId,
      destinations,
      getDirectMessagesForUser,
      getProfileById,
      loading,
      localState,
      profile,
      token,
      updateUser,
      user,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}

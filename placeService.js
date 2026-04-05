import { destinationCatalog } from "../data/mockData";

function normalizePlaceResult(item, index) {
  const parts = String(item.display_name || "").split(",");
  const name = item.address?.city || item.address?.town || item.address?.village || parts[0]?.trim() || item.name || "Suggested place";
  const state = item.address?.state || item.address?.region || "India";
  const country = item.address?.country || parts.at(-1)?.trim() || "India";

  return {
    id: `live-${item.place_id || index}`,
    name,
    state,
    country,
    vibe: item.type ? item.type.replaceAll("_", " ") : "Local discovery",
    budget: "Flexible",
    lat: Number(item.lat),
    lon: Number(item.lon),
    rating: 4.4,
    tags: [item.class || "travel", item.type || "place"].filter(Boolean),
    description: `Live place discovery from OpenStreetMap search for ${name}.`,
    fact: `This suggestion came from live map search results for ${name}.`,
    reviews: [],
    source: "live",
  };
}

export async function searchPlaces(query) {
  if (!query || query.trim().length < 3) {
    return [];
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=12&q=${encodeURIComponent(query.trim())}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Place search failed.");
  }

  const data = await response.json();
  return data.map(normalizePlaceResult).filter((item) => !Number.isNaN(item.lat) && !Number.isNaN(item.lon));
}

export function mergePlaces(livePlaces = []) {
  const basePlaces = destinationCatalog.map((place) => ({ ...place, source: "catalog" }));
  const seen = new Set(basePlaces.map((place) => `${place.name}-${place.state}-${place.country}`.toLowerCase()));

  const nextLivePlaces = livePlaces.filter((place) => {
    const key = `${place.name}-${place.state}-${place.country}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return [...nextLivePlaces, ...basePlaces];
}

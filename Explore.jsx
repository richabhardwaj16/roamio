import { useEffect, useMemo, useState } from "react";
import AIPlanner from "../components/AIPlanner";
import MapView from "../components/map/MapView";
import { useAppData } from "../contexts/AppDataContext";
import { useToast } from "../contexts/ToastContext";
import { mergePlaces, searchPlaces } from "../services/placeService";
import { applyStateTheme } from "../theme/stateTheme";

function Explore() {
  const { destinations, addReview, loading } = useAppData();
  const { showToast } = useToast();

  const [selectedPlaceId, setSelectedPlaceId] = useState(() => destinations[0]?.id || null);
  const [query, setQuery] = useState("");
  const [currentPosition, setCurrentPosition] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [livePlaces, setLivePlaces] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadLivePlaces() {
      if (!query.trim() || query.trim().length < 3) {
        setLivePlaces([]);
        return;
      }

      setLiveLoading(true);

      try {
        const results = await searchPlaces(query);

        if (active) {
          setLivePlaces(results);
        }
      } catch {
        if (active) {
          setLivePlaces([]);
        }
      } finally {
        if (active) {
          setLiveLoading(false);
        }
      }
    }

    loadLivePlaces();

    return () => {
      active = false;
    };
  }, [query]);

  const allPlaces = useMemo(() => {
    const merged = mergePlaces(livePlaces);

    return merged.map((place) => ({
      ...place,
      reviews:
        destinations.find((item) => item.id === place.id)?.reviews ||
        place.reviews ||
        [],
    }));
  }, [destinations, livePlaces]);

  const filteredDestinations = useMemo(() => {
    const normalized = query.toLowerCase();

    return allPlaces.filter(
      (destination) =>
        destination.name.toLowerCase().includes(normalized) ||
        destination.state?.toLowerCase().includes(normalized) ||
        destination.country.toLowerCase().includes(normalized) ||
        destination.tags.some((tag) =>
          tag.toLowerCase().includes(normalized)
        )
    );
  }, [allPlaces, query]);

  const visibleSuggestions = useMemo(() => filteredDestinations.slice(0, 8), [filteredDestinations]);

  const selectedPlace =
    filteredDestinations.find((destination) => destination.id === selectedPlaceId) ||
    allPlaces.find((destination) => destination.id === selectedPlaceId) ||
    destinations[0] ||
    null;

  const currentTheme = () =>
    document.documentElement.getAttribute("data-theme") ||
    localStorage.getItem("roamio-theme") ||
    "light";

  useEffect(() => {
    if (selectedPlace?.state) {
      localStorage.setItem("roamio-last-state", JSON.stringify(selectedPlace.state));
      applyStateTheme(selectedPlace.state, currentTheme());
    }
  }, [selectedPlace]);

  function handleUseLocation() {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCurrentPosition([coords.latitude, coords.longitude]);

        showToast({
          title: "Live location enabled",
          message: "The travel map is centered on your current position.",
          tone: "success",
        });
      },
      () => {
        setCurrentPosition([19.076, 72.8777]);

        showToast({
          title: "Location fallback applied",
          message:
            "Using the default city because live location was unavailable.",
          tone: "neutral",
        });
      }
    );
  }

  async function submitReview() {
    if (!selectedPlace || !reviewText.trim()) return;

    await addReview({
      placeId: selectedPlace.id,
      rating: 5,
      text: reviewText.trim(),
    });

    setReviewText("");

    showToast({
      title: "Review added",
      message: `Your note for ${selectedPlace.name} is now saved.`,
      tone: "success",
    });
  }

  function handleSelectPlace(place) {
    setSelectedPlaceId(place.id);
    setQuery(place.name);
    const state = place.state || place.name || "";
    localStorage.setItem("roamio-selected-state", "true");
    localStorage.setItem("roamio-last-state", JSON.stringify(state));
    applyStateTheme(state, currentTheme());
  }

  return (
    <div className="page-grid">
      {loading && (
        <div className="panel empty-state">
          Loading your travel data...
        </div>
      )}

      <section className="hero-panel explore-hero">
        <div className="hero-copy">
          <p className="eyebrow">Explore</p>
          <h2>Search places, scan the map, and turn discoveries into plans.</h2>
          <p>
            Browse destination suggestions, search live places, save reviews, and pass the best
            ideas into your itinerary.
          </p>
          <div className="tag-row top-summary-tags">
            <span className="tag-pill">Live map</span>
            <span className="tag-pill">Place reviews</span>
            <span className="tag-pill">Random facts</span>
            <span className="tag-pill">AI itinerary handoff</span>
          </div>
        </div>
        <div className="hero-glass-card">
          <p className="eyebrow">Selected place</p>
          <strong>{selectedPlace ? selectedPlace.name : "Choose a place"}</strong>
          <p>
            Search by destination, vibe, or tags, then use the map and review panel to narrow your
            next stop.
          </p>
        </div>
      </section>

      <section className="panel panel-wide">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Explore</p>
            <h2>Live travel map and destination suggestions</h2>
            <p>
              Find places faster, lock onto one destination, then review and
              plan from the same view.
            </p>
          </div>

          <div className="inline-actions explore-search-bar">
            <div className="explore-inline-search">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search destinations or vibes"
              />
              {query.trim() && (
                <div className="explore-inline-dropdown">
                  {liveLoading && <div className="explore-inline-empty">Searching...</div>}
                  {!liveLoading && visibleSuggestions.length === 0 && (
                    <div className="explore-inline-empty">No matches yet.</div>
                  )}
                  {!liveLoading &&
                    visibleSuggestions.map((destination) => (
                      <button
                        key={destination.id}
                        type="button"
                        className={`explore-inline-item ${
                          selectedPlace?.id === destination.id ? "explore-inline-item-active" : ""
                        }`}
                        onClick={() => handleSelectPlace(destination)}
                      >
                        <div className="explore-inline-topline">
                          <strong>{destination.name}</strong>
                          <span>{destination.rating}</span>
                        </div>
                        <small>
                          {destination.state || destination.country} • {destination.vibe}
                        </small>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <button className="secondary-button" onClick={handleUseLocation}>
              Use live location
            </button>
          </div>
        </div>

        <div className="explore-layout">
          <div className="map-panel">
            <MapView
              currentPosition={currentPosition}
              places={filteredDestinations}
              selectedPlaceId={selectedPlace?.id}
              onSelectPlace={(place) => setSelectedPlaceId(place?.id || null)}
            />
          </div>

          <div className="stack-list explore-column">
            {selectedPlace ? (
              <article className="destination-card destination-card-active explore-selected-card">
                <div className="card-topline">
                  <strong>
                    {selectedPlace.name}, {selectedPlace.state || selectedPlace.country}
                  </strong>
                  <span className="match-pill">{selectedPlace.rating}</span>
                </div>
                <span>{selectedPlace.vibe}</span>
                <div className="tag-row compact-tags">
                  {selectedPlace.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
                <small>{selectedPlace.budget} traveler fit</small>
              </article>
            ) : (
              <div className="panel empty-state">
                Search and select an Indian destination to continue.
              </div>
            )}

            <div className="panel explore-list-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Suggestions</p>
                  <h3>India travel picks</h3>
                </div>
              </div>

              <div className="stack-list compact-stack">
                {filteredDestinations.slice(0, 6).map((destination) => (
                  <button
                    key={destination.id}
                    className={`destination-card ${
                      selectedPlace?.id === destination.id ? "destination-card-active" : ""
                    }`}
                    onClick={() => handleSelectPlace(destination)}
                  >
                    <div className="card-topline">
                      <strong>
                        {destination.name}, {destination.state || destination.country}
                      </strong>
                      <span className="match-pill">{destination.rating}</span>
                    </div>
                    <span>{destination.vibe}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedPlace && (
        <section className="two-column-grid">
          <article className="panel place-focus-panel">
            <p className="eyebrow">Place snapshot</p>

            <h3>{selectedPlace.name}</h3>

            <p>{selectedPlace.description}</p>

            <div className="info-grid">
              <div className="info-block">
                <span>Budget fit</span>
                <strong>{selectedPlace.budget}</strong>
              </div>
              <div className="info-block">
                <span>Travel vibe</span>
                <strong>{selectedPlace.vibe}</strong>
              </div>
            </div>

            <div className="tag-row">
              {selectedPlace.tags.map((tag) => (
                <span key={tag} className="tag-pill">
                  {tag}
                </span>
              ))}
            </div>

            <div className="fact-box">
              <strong>Random fact</strong>
              <p>{selectedPlace.fact}</p>
            </div>
          </article>

          <article className="panel place-reviews-panel">
            <p className="eyebrow">Place reviews</p>

            <h3>Traveler feedback</h3>

            <div className="stack-list compact-stack reviews-stack">
              {selectedPlace.reviews.length === 0 && (
                <p className="muted-text">No reviews yet. Add the first one.</p>
              )}

              {selectedPlace.reviews.map((review) => (
                <div
                  key={review.id}
                  className="list-card list-card-column review-card"
                >
                  <strong>{review.author}</strong>
                  <span>{review.text}</span>
                </div>
              ))}
            </div>

            <textarea
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              placeholder="Add a place review"
              className="review-textarea"
            />

            <div className="panel-actions review-actions">
              <button onClick={submitReview}>
                Submit review
              </button>
            </div>
          </article>
        </section>
      )}

      <AIPlanner
        title="Destination planner"
        defaultPrompt={
          selectedPlace
            ? `${selectedPlace.name} travel plan for a ${selectedPlace.budget.toLowerCase()} traveler`
            : ""
        }
      />
    </div>
  );
}

export default Explore;

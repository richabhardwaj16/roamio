import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapView({ currentPosition, places, selectedPlaceId, onSelectPlace }) {
  const center = currentPosition || [20.5937, 78.9629];

  return (
    <MapContainer center={center} zoom={5} scrollWheelZoom className="travel-map">
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {currentPosition && (
        <CircleMarker center={currentPosition} radius={10} pathOptions={{ color: "#ff7a59" }}>
          <Popup>Your live location</Popup>
        </CircleMarker>
      )}

      {places.map((place) => (
        <CircleMarker
          key={place.id}
          center={[place.lat, place.lon]}
          radius={selectedPlaceId === place.id ? 12 : 8}
          pathOptions={{
            color: selectedPlaceId === place.id ? "#0f0f18" : "#0b8f72",
            fillColor: selectedPlaceId === place.id ? "#f3c969" : "#90f2d0",
            fillOpacity: 0.9,
          }}
          eventHandlers={{
            click: () => onSelectPlace(place),
          }}
        >
          <Popup>
            <strong>{place.name}</strong>
            <div>{place.country}</div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

export default MapView;

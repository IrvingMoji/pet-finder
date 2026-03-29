"use client";
import { useState, useCallback, memo } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 19.4326,
  lng: -99.1332
};

function LocationPicker({ onLocationSelect, initialPosition = null }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  });

  const [position, setPosition] = useState(initialPosition);

  const onClick = useCallback((e) => {
    const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setPosition(newPos);
    onLocationSelect(newPos);
  }, [onLocationSelect]);

  return isLoaded ? (
    <div style={{ height: "300px", width: "100%", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: "1rem", border: "1px solid var(--border)" }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={position || center}
        zoom={13}
        onClick={onClick}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
        }}
      >
        {position && <Marker position={position} />}
      </GoogleMap>
    </div>
  ) : (
    <div style={{ height: "300px", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius)" }}>
      <p style={{ color: "#666" }}>Cargando Google Maps...</p>
    </div>
  );
}

export default memo(LocationPicker);

"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { MapProps, MarkerData } from "./CrossPlatformMap.types";

// Fix default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function FitBoundsWeb({ pickup, dropoff }: { pickup?: MarkerData; dropoff?: MarkerData }) {
  const map = useMap();

  useEffect(() => {
    if (pickup && dropoff) {
      map.fitBounds([
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng],
      ]);
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 15);
    } else if (dropoff) {
      map.setView([dropoff.lat, dropoff.lng], 15);
    }
  }, [pickup, dropoff, map]);

  return null;
}

export default function LeafletMap({ latitude, longitude, pickup, dropoff, riderLocation }: MapProps) {
  return (
    <div style={{ width: "100%", height: 400 }}>
      <MapContainer
        center={[latitude, longitude] as [number, number]}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Fit bounds */}
        <FitBoundsWeb pickup={pickup} dropoff={dropoff} />

        {/* Current location marker */}
        <Marker position={[latitude, longitude]}>
          <Popup>You are here 🚖</Popup>
        </Marker>

        {/* Pickup marker */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]}>
            <Popup>{pickup.label ?? "Pickup"}</Popup>
          </Marker>
        )}

        {/* Dropoff marker */}
        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]}>
            <Popup>{dropoff.label ?? "Dropoff"}</Popup>
          </Marker>
        )}

        {/* Rider marker */}
        {riderLocation && (
          <Marker position={[riderLocation.lat, riderLocation.lng]}>
            <Popup>{riderLocation.label ?? "Rider's location"}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

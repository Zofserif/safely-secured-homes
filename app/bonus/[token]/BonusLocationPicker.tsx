"use client";

import { useEffect } from "react";
import { divIcon, type Marker as LeafletMarker } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

type Coordinates = {
  lat: number;
  lng: number;
};

type BonusLocationPickerProps = {
  center: Coordinates;
  value: Coordinates | null;
  onChange: (value: Coordinates) => void;
};

const DEFAULT_MAP_ZOOM = 6;
const PINNED_MAP_ZOOM = 16;

const locationPinIcon = divIcon({
  className: "bonus-location-marker",
  html: '<span class="bonus-location-marker__pin"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapViewport({
  center,
  zoom,
}: {
  center: Coordinates;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true });
  }, [center.lat, center.lng, map, zoom]);

  return null;
}

function InteractivePin({
  value,
  onChange,
}: {
  value: Coordinates | null;
  onChange: (value: Coordinates) => void;
}) {
  useMapEvents({
    click(event) {
      onChange({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  if (!value) return null;

  return (
    <Marker
      draggable
      icon={locationPinIcon}
      position={[value.lat, value.lng]}
      eventHandlers={{
        dragend(event) {
          const marker = event.target as LeafletMarker;
          const nextPosition = marker.getLatLng();
          onChange({
            lat: nextPosition.lat,
            lng: nextPosition.lng,
          });
        },
      }}
    />
  );
}

export default function BonusLocationPicker({
  center,
  value,
  onChange,
}: BonusLocationPickerProps) {
  const zoom = value ? PINNED_MAP_ZOOM : DEFAULT_MAP_ZOOM;

  return (
    <MapContainer
      attributionControl
      center={[center.lat, center.lng]}
      className="bonus-location-map"
      scrollWheelZoom={false}
      zoom={zoom}
    >
      <MapViewport center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <InteractivePin value={value} onChange={onChange} />
    </MapContainer>
  );
}

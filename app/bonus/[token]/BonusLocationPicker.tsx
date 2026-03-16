"use client";

import { useEffect } from "react";
import { divIcon, type Marker as LeafletMarker } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import {
  BONUS_DELIVERY_MAP_BOUNDS,
  BONUS_DELIVERY_MAP_MIN_ZOOM,
  type BonusDeliveryCoordinates as Coordinates,
  isWithinBonusDeliveryBounds,
} from "../../lib/bonusDeliveryCoverage";

type BonusLocationPickerProps = {
  center: Coordinates;
  value: Coordinates | null;
  onChange: (value: Coordinates) => void;
  onInvalidSelection: () => void;
};

const DEFAULT_MAP_ZOOM = BONUS_DELIVERY_MAP_MIN_ZOOM;
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
  onInvalidSelection,
}: {
  value: Coordinates | null;
  onChange: (value: Coordinates) => void;
  onInvalidSelection: () => void;
}) {
  useMapEvents({
    click(event) {
      const nextLocation = {
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      };

      if (!isWithinBonusDeliveryBounds(nextLocation)) {
        onInvalidSelection();
        return;
      }

      onChange(nextLocation);
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
          const nextLocation = {
            lat: nextPosition.lat,
            lng: nextPosition.lng,
          };

          if (!isWithinBonusDeliveryBounds(nextLocation)) {
            marker.setLatLng([value.lat, value.lng]);
            onInvalidSelection();
            return;
          }

          onChange(nextLocation);
        },
      }}
    />
  );
}

export default function BonusLocationPicker({
  center,
  value,
  onChange,
  onInvalidSelection,
}: BonusLocationPickerProps) {
  const zoom = value ? PINNED_MAP_ZOOM : DEFAULT_MAP_ZOOM;
  const viewportCenter = value ?? center;

  return (
    <MapContainer
      attributionControl
      center={[center.lat, center.lng]}
      className="bonus-location-map"
      maxBounds={[
        [BONUS_DELIVERY_MAP_BOUNDS[0][0], BONUS_DELIVERY_MAP_BOUNDS[0][1]],
        [BONUS_DELIVERY_MAP_BOUNDS[1][0], BONUS_DELIVERY_MAP_BOUNDS[1][1]],
      ]}
      maxBoundsViscosity={1}
      minZoom={BONUS_DELIVERY_MAP_MIN_ZOOM}
      scrollWheelZoom={false}
      zoom={zoom}
    >
      <MapViewport center={viewportCenter} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <InteractivePin
        value={value}
        onChange={onChange}
        onInvalidSelection={onInvalidSelection}
      />
    </MapContainer>
  );
}

export type BonusDeliveryCoordinates = {
  lat: number;
  lng: number;
};

export type BonusDeliveryCoverageCode =
  | "outside_service_area"
  | "unverifiable_location";

export type BonusDeliveryCoverageResult =
  | {
      ok: true;
      areaLabel: string;
    }
  | {
      ok: false;
      code: BonusDeliveryCoverageCode;
    };

export type BonusDeliveryAddress = Partial<
  Record<
    | "province"
    | "state"
    | "region"
    | "county"
    | "state_district"
    | "city"
    | "municipality"
    | "city_district"
    | "suburb"
    | "country"
    | "country_code",
    string | null
  >
>;

export const BONUS_DELIVERY_MAP_CENTER: BonusDeliveryCoordinates = {
  lat: 14.15,
  lng: 121.05,
};

export const BONUS_DELIVERY_MAP_BOUNDS = [
  [13.35, 120.55],
  [14.95, 122.35],
] as const;

export const BONUS_DELIVERY_MAP_MIN_ZOOM = 8;

export const BONUS_DELIVERY_ALLOWED_AREA_NAMES = [
  "Metro Manila",
  "National Capital Region",
  "NCR",
  "CALABARZON",
  "Cavite",
  "Laguna",
  "Batangas",
  "Rizal",
  "Quezon",
] as const;

export const BONUS_DELIVERY_REQUIRED_ERROR =
  "Please pin your delivery location within Metro Manila or CALABARZON.";

export const BONUS_DELIVERY_OUTSIDE_SERVICE_AREA_ERROR =
  "We only deliver bonus claims within Metro Manila or CALABARZON. Move the pin inside our service area.";

export const BONUS_DELIVERY_UNVERIFIABLE_ERROR =
  "We could not verify that pinned location. Try again or choose a nearby spot within Metro Manila or CALABARZON.";

const BONUS_DELIVERY_AREA_LABELS = new Map<string, string>([
  ["metro manila", "Metro Manila"],
  ["national capital region", "Metro Manila"],
  ["ncr", "Metro Manila"],
  ["calabarzon", "CALABARZON"],
  ["cavite", "Cavite"],
  ["laguna", "Laguna"],
  ["batangas", "Batangas"],
  ["rizal", "Rizal"],
  ["quezon", "Quezon"],
]);

const BONUS_DELIVERY_ADDRESS_FIELD_PRIORITY: Array<keyof BonusDeliveryAddress> = [
  "province",
  "state",
  "region",
  "county",
  "state_district",
  "city",
  "municipality",
  "city_district",
  "suburb",
];

const normalizeBonusDeliveryAreaToken = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");

export const getRoundedBonusDeliveryLocationKey = (
  location: BonusDeliveryCoordinates,
  precision = 4,
): string => `${location.lat.toFixed(precision)},${location.lng.toFixed(precision)}`;

export const parseBonusDeliveryCoordinates = (
  value: unknown,
): BonusDeliveryCoordinates | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const lat = typeof (value as { lat?: unknown }).lat === "number"
    ? (value as { lat: number }).lat
    : Number.NaN;
  const lng = typeof (value as { lng?: unknown }).lng === "number"
    ? (value as { lng: number }).lng
    : Number.NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
};

export const isWithinBonusDeliveryBounds = (
  location: BonusDeliveryCoordinates,
): boolean => {
  const [[minLat, minLng], [maxLat, maxLng]] = BONUS_DELIVERY_MAP_BOUNDS;

  return (
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    location.lat >= minLat &&
    location.lat <= maxLat &&
    location.lng >= minLng &&
    location.lng <= maxLng
  );
};

export const normalizeBonusDeliveryAreaName = (
  value: unknown,
): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = normalizeBonusDeliveryAreaToken(value);
  return BONUS_DELIVERY_AREA_LABELS.get(normalizedValue) ?? null;
};

export const resolveBonusDeliveryAreaLabelFromAddress = (
  address: BonusDeliveryAddress | null | undefined,
): string | null => {
  if (!address) {
    return null;
  }

  for (const field of BONUS_DELIVERY_ADDRESS_FIELD_PRIORITY) {
    const areaLabel = normalizeBonusDeliveryAreaName(address[field]);
    if (areaLabel) {
      return areaLabel;
    }
  }

  return null;
};

export const getBonusDeliveryCoverageFailureMessage = (
  code: BonusDeliveryCoverageCode,
): string =>
  code === "outside_service_area"
    ? BONUS_DELIVERY_OUTSIDE_SERVICE_AREA_ERROR
    : BONUS_DELIVERY_UNVERIFIABLE_ERROR;

import {
  type BonusDeliveryAddress,
  type BonusDeliveryCoordinates,
  type BonusDeliveryCoverageResult,
  getRoundedBonusDeliveryLocationKey,
  isWithinBonusDeliveryBounds,
  resolveBonusDeliveryAreaLabelFromAddress,
} from "./bonusDeliveryCoverage.ts";
import { siteUrl } from "./site.ts";

type BonusDeliveryReverseGeocodeResponse = {
  address?: BonusDeliveryAddress | null;
};

type CachedReverseGeocodeValue = BonusDeliveryReverseGeocodeResponse | null;

type ReverseGeocodeCacheEntry = {
  expiresAt: number;
  value: Promise<CachedReverseGeocodeValue> | CachedReverseGeocodeValue;
};

type ValidateBonusDeliveryLocationOptions = {
  reverseGeocode?: (
    location: BonusDeliveryCoordinates,
  ) => Promise<BonusDeliveryReverseGeocodeResponse | null>;
};

const BONUS_DELIVERY_NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/reverse";
const BONUS_DELIVERY_SUCCESS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const BONUS_DELIVERY_FAILURE_CACHE_TTL_MS = 5 * 60 * 1000;
const BONUS_DELIVERY_FETCH_TIMEOUT_MS = 8000;

const reverseGeocodeCache = new Map<string, ReverseGeocodeCacheEntry>();

const getBonusDeliveryUserAgent = (): string => {
  const contactEmail = process.env.BONUS_DELIVERY_CONTACT_EMAIL?.trim();
  return contactEmail
    ? `SafelySecuredHomesBonusCoverage/1.0 (${siteUrl}; ${contactEmail})`
    : `SafelySecuredHomesBonusCoverage/1.0 (${siteUrl})`;
};

const getCachedReverseGeocodeEntry = (
  key: string,
): ReverseGeocodeCacheEntry | null => {
  const now = Date.now();
  const cachedEntry = reverseGeocodeCache.get(key);

  if (!cachedEntry) {
    return null;
  }

  if (cachedEntry.expiresAt <= now) {
    reverseGeocodeCache.delete(key);
    return null;
  }

  return cachedEntry;
};

const setCachedReverseGeocodeEntry = (
  key: string,
  value: Promise<CachedReverseGeocodeValue> | CachedReverseGeocodeValue,
  ttlMs: number,
) => {
  reverseGeocodeCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

export const reverseGeocodeBonusDeliveryLocation = async (
  location: BonusDeliveryCoordinates,
): Promise<BonusDeliveryReverseGeocodeResponse | null> => {
  const cacheKey = getRoundedBonusDeliveryLocationKey(location);
  const cachedEntry = getCachedReverseGeocodeEntry(cacheKey);

  if (cachedEntry) {
    return Promise.resolve(cachedEntry.value);
  }

  const query = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    lat: String(location.lat),
    lon: String(location.lng),
    zoom: "18",
  });

  const contactEmail = process.env.BONUS_DELIVERY_CONTACT_EMAIL?.trim();
  if (contactEmail) {
    query.set("email", contactEmail);
  }

  const requestPromise = fetch(`${BONUS_DELIVERY_NOMINATIM_URL}?${query.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      Referer: siteUrl,
      "User-Agent": getBonusDeliveryUserAgent(),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(BONUS_DELIVERY_FETCH_TIMEOUT_MS),
  })
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }

      const body =
        (await response.json().catch(() => null)) as BonusDeliveryReverseGeocodeResponse | null;

      return body && typeof body === "object" ? body : null;
    })
    .then((result) => {
      setCachedReverseGeocodeEntry(
        cacheKey,
        result,
        result ? BONUS_DELIVERY_SUCCESS_CACHE_TTL_MS : BONUS_DELIVERY_FAILURE_CACHE_TTL_MS,
      );
      return result;
    })
    .catch(() => {
      reverseGeocodeCache.delete(cacheKey);
      return null;
    });

  setCachedReverseGeocodeEntry(
    cacheKey,
    requestPromise,
    BONUS_DELIVERY_FAILURE_CACHE_TTL_MS,
  );

  return requestPromise;
};

export const validateBonusDeliveryLocation = async (
  location: BonusDeliveryCoordinates,
  options: ValidateBonusDeliveryLocationOptions = {},
): Promise<BonusDeliveryCoverageResult> => {
  if (!isWithinBonusDeliveryBounds(location)) {
    return {
      ok: false,
      code: "outside_service_area",
    };
  }

  const reverseGeocode =
    options.reverseGeocode ?? reverseGeocodeBonusDeliveryLocation;
  const reverseGeocodeResult = await reverseGeocode(location);

  if (!reverseGeocodeResult?.address) {
    return {
      ok: false,
      code: "unverifiable_location",
    };
  }

  const areaLabel = resolveBonusDeliveryAreaLabelFromAddress(
    reverseGeocodeResult.address,
  );

  if (!areaLabel) {
    return {
      ok: false,
      code: "outside_service_area",
    };
  }

  return {
    ok: true,
    areaLabel,
  };
};

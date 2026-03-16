import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const coverageModule = (await import(
  new URL("../app/lib/bonusDeliveryCoverage.ts", import.meta.url).href
)) as typeof import("../app/lib/bonusDeliveryCoverage");
const coverageServerModule = (await import(
  new URL("../app/lib/bonusDeliveryCoverageServer.ts", import.meta.url).href
)) as typeof import("../app/lib/bonusDeliveryCoverageServer");
const claimValidationModule = (await import(
  new URL("../app/lib/bonusClaimValidation.ts", import.meta.url).href
)) as typeof import("../app/lib/bonusClaimValidation");

const {
  BONUS_DELIVERY_OUTSIDE_SERVICE_AREA_ERROR,
  BONUS_DELIVERY_REQUIRED_ERROR,
  BONUS_DELIVERY_UNVERIFIABLE_ERROR,
  getBonusDeliveryCoverageFailureMessage,
  isWithinBonusDeliveryBounds,
  normalizeBonusDeliveryAreaName,
  resolveBonusDeliveryAreaLabelFromAddress,
} = coverageModule;
const { validateBonusDeliveryLocation } = coverageServerModule;
const { getBonusClaimFieldErrors } = claimValidationModule;

assert.equal(
  normalizeBonusDeliveryAreaName("Metro Manila"),
  "Metro Manila",
  "Metro Manila should normalize to the canonical NCR label",
);
assert.equal(
  normalizeBonusDeliveryAreaName("National Capital Region"),
  "Metro Manila",
  "National Capital Region should normalize to Metro Manila",
);
assert.equal(
  normalizeBonusDeliveryAreaName("NCR"),
  "Metro Manila",
  "NCR should normalize to Metro Manila",
);
assert.equal(
  normalizeBonusDeliveryAreaName("calabarzon"),
  "CALABARZON",
  "CALABARZON should normalize case-insensitively",
);

assert.equal(
  resolveBonusDeliveryAreaLabelFromAddress({ province: "Cavite" }),
  "Cavite",
  "province fields should resolve serviceable CALABARZON locations",
);
assert.equal(
  resolveBonusDeliveryAreaLabelFromAddress({ region: "CALABARZON" }),
  "CALABARZON",
  "region fields should resolve the broader CALABARZON label",
);
assert.equal(
  resolveBonusDeliveryAreaLabelFromAddress({ province: "Bulacan" }),
  null,
  "non-service provinces should not resolve to an allowed area",
);

assert.equal(
  isWithinBonusDeliveryBounds({ lat: 14.5995, lng: 120.9842 }),
  true,
  "Metro Manila coordinates should be inside delivery bounds",
);
assert.equal(
  isWithinBonusDeliveryBounds({ lat: 10.3157, lng: 123.8854 }),
  false,
  "Cebu coordinates should be outside delivery bounds",
);

assert.deepEqual(
  await validateBonusDeliveryLocation(
    { lat: 14.5995, lng: 120.9842 },
    {
      reverseGeocode: async () => ({
        address: { region: "National Capital Region" },
      }),
    },
  ),
  { ok: true, areaLabel: "Metro Manila" },
  "Metro Manila pins should validate through NCR region aliases",
);
assert.deepEqual(
  await validateBonusDeliveryLocation(
    { lat: 14.2821, lng: 120.8667 },
    {
      reverseGeocode: async () => ({
        address: { province: "Cavite" },
      }),
    },
  ),
  { ok: true, areaLabel: "Cavite" },
  "Cavite pins should validate through province matching",
);
assert.deepEqual(
  await validateBonusDeliveryLocation(
    { lat: 14.2117, lng: 121.1653 },
    {
      reverseGeocode: async () => ({
        address: { province: "Laguna" },
      }),
    },
  ),
  { ok: true, areaLabel: "Laguna" },
  "Laguna pins should validate through province matching",
);
assert.deepEqual(
  await validateBonusDeliveryLocation(
    { lat: 13.7565, lng: 121.0583 },
    {
      reverseGeocode: async () => ({
        address: { province: "Batangas" },
      }),
    },
  ),
  { ok: true, areaLabel: "Batangas" },
  "Batangas pins should validate through province matching",
);
assert.deepEqual(
  await validateBonusDeliveryLocation(
    { lat: 14.6255, lng: 121.1245 },
    {
      reverseGeocode: async () => ({
        address: { province: "Rizal" },
      }),
    },
  ),
  { ok: true, areaLabel: "Rizal" },
  "Rizal pins should validate through province matching",
);
assert.deepEqual(
  await validateBonusDeliveryLocation(
    { lat: 13.9411, lng: 121.6236 },
    {
      reverseGeocode: async () => ({
        address: { province: "Quezon" },
      }),
    },
  ),
  { ok: true, areaLabel: "Quezon" },
  "Quezon pins should validate through province matching",
);
assert.deepEqual(
  await validateBonusDeliveryLocation(
    { lat: 14.1776, lng: 121.2417 },
    {
      reverseGeocode: async () => ({
        address: { region: "CALABARZON" },
      }),
    },
  ),
  { ok: true, areaLabel: "CALABARZON" },
  "CALABARZON regional matches should validate when province data is absent",
);

assert.deepEqual(
  await validateBonusDeliveryLocation(
    { lat: 14.7569, lng: 120.9483 },
    {
      reverseGeocode: async () => ({
        address: { province: "Bulacan" },
      }),
    },
  ),
  { ok: false, code: "outside_service_area" },
  "Bulacan should be rejected even when still inside the broader map bounds",
);
assert.deepEqual(
  await validateBonusDeliveryLocation(
    { lat: 15.0343, lng: 120.6844 },
    {
      reverseGeocode: async () => ({
        address: { province: "Pampanga" },
      }),
    },
  ),
  { ok: false, code: "outside_service_area" },
  "Pampanga should be rejected outside the service area",
);
assert.deepEqual(
  await validateBonusDeliveryLocation(
    { lat: 13.1391, lng: 123.7438 },
    {
      reverseGeocode: async () => ({
        address: { province: "Albay" },
      }),
    },
  ),
  { ok: false, code: "outside_service_area" },
  "Bicol locations should be rejected outside the service area",
);
assert.deepEqual(
  await validateBonusDeliveryLocation(
    { lat: 10.3157, lng: 123.8854 },
    {
      reverseGeocode: async () => ({
        address: { province: "Cebu" },
      }),
    },
  ),
  { ok: false, code: "outside_service_area" },
  "Cebu locations should be rejected outside the service area",
);
assert.deepEqual(
  await validateBonusDeliveryLocation(
    { lat: 14.5995, lng: 120.9842 },
    {
      reverseGeocode: async () => ({
        address: null,
      }),
    },
  ),
  { ok: false, code: "unverifiable_location" },
  "malformed reverse-geocode payloads should fail closed",
);

assert.equal(
  getBonusDeliveryCoverageFailureMessage("outside_service_area"),
  BONUS_DELIVERY_OUTSIDE_SERVICE_AREA_ERROR,
  "outside-service failures should surface the delivery-area error copy",
);
assert.equal(
  getBonusDeliveryCoverageFailureMessage("unverifiable_location"),
  BONUS_DELIVERY_UNVERIFIABLE_ERROR,
  "unverifiable failures should surface the verification error copy",
);

const missingLocationFieldErrors = await getBonusClaimFieldErrors({
  name: "Lemon Brook",
  mobile: "09959959229",
  address: "Makati, Metro Manila",
  location: null,
  validateBonusDeliveryLocation: async () => ({
    ok: true,
    areaLabel: "Metro Manila",
  }),
});
assert.equal(
  missingLocationFieldErrors.location,
  BONUS_DELIVERY_REQUIRED_ERROR,
  "claim requests without a pin should surface the required-pin error",
);

const outOfAreaClaimFieldErrors = await getBonusClaimFieldErrors({
  name: "Lemon Brook",
  mobile: "09959959229",
  address: "Meycauayan, Bulacan",
  location: {
    lat: 14.7569,
    lng: 120.9483,
  },
  validateBonusDeliveryLocation: async () => ({
    ok: false,
    code: "outside_service_area",
  }),
});
assert.equal(
  outOfAreaClaimFieldErrors.location,
  BONUS_DELIVERY_OUTSIDE_SERVICE_AREA_ERROR,
  "claim requests outside service coverage should surface the delivery-area error",
);

const validClaimFieldErrors = await getBonusClaimFieldErrors({
  name: "Lemon Brook",
  mobile: "09959959229",
  address: "Makati, Metro Manila",
  location: {
    lat: 14.5995,
    lng: 120.9842,
  },
  validateBonusDeliveryLocation: async () => ({
    ok: true,
    areaLabel: "Metro Manila",
  }),
});
assert.deepEqual(
  validClaimFieldErrors,
  {},
  "valid Metro Manila claims should pass without field errors",
);

const validLagunaClaimFieldErrors = await getBonusClaimFieldErrors({
  name: "Lemon Brook",
  mobile: "09959959229",
  address: "Calamba, Laguna",
  location: {
    lat: 14.2117,
    lng: 121.1653,
  },
  validateBonusDeliveryLocation: async () => ({
    ok: true,
    areaLabel: "Laguna",
  }),
});
assert.equal(
  Object.keys(validLagunaClaimFieldErrors).length,
  0,
  "valid CALABARZON claims should also pass without field errors",
);

const claimRouteSource = readFileSync(
  new URL("../app/api/bonus-links/claim/route.ts", import.meta.url),
  "utf8",
);
const coverageRouteSource = readFileSync(
  new URL("../app/api/bonus-links/coverage/route.ts", import.meta.url),
  "utf8",
);
const claimPageClientSource = readFileSync(
  new URL("../app/bonus/[token]/BonusClaimPageClient.tsx", import.meta.url),
  "utf8",
);

assert.match(
  claimRouteSource,
  /getBonusClaimFieldErrors/,
  "the claim route should use the shared claim-field validation helper",
);
assert.match(
  claimRouteSource,
  /claimBonusLink/,
  "the claim route should still delegate successful submissions to claimBonusLink",
);
assert.match(
  coverageRouteSource,
  /parseBonusDeliveryCoordinates/,
  "the coverage route should reject malformed coordinate payloads",
);
assert.match(
  coverageRouteSource,
  /validateBonusDeliveryLocation/,
  "the coverage route should use the shared delivery-area validator",
);
assert.match(
  claimPageClientSource,
  /\/api\/bonus-links\/coverage/,
  "the bonus claim page should validate pin selections against the coverage API",
);
assert.match(
  claimPageClientSource,
  /location:\s*pinnedLocation/,
  "the bonus claim page should submit the pinned coordinates with the claim payload",
);

console.log("All bonus delivery coverage checks passed.");

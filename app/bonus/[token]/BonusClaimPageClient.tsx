"use client";

import {
  type FormEvent,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  BONUS_LINK_MOBILE_REGEX,
  BONUS_LINK_VIDEO_URL,
  type BonusLinkClaimedStatus,
  type BonusLinkStatus,
  isValidBonusLinkKey,
} from "../../lib/bonusClaimLinks";
import {
  BONUS_DELIVERY_MAP_CENTER,
  BONUS_DELIVERY_OUTSIDE_SERVICE_AREA_ERROR,
  BONUS_DELIVERY_REQUIRED_ERROR,
  BONUS_DELIVERY_UNVERIFIABLE_ERROR,
  type BonusDeliveryCoordinates as Coordinates,
  type BonusDeliveryCoverageCode,
  type BonusDeliveryCoverageResult,
  getBonusDeliveryCoverageFailureMessage,
  getRoundedBonusDeliveryLocationKey,
  isWithinBonusDeliveryBounds,
} from "../../lib/bonusDeliveryCoverage";

type BonusClaimPageClientProps = {
  token: string;
};

type FieldErrors = Partial<Record<"name" | "mobile" | "address" | "location", string>>;

type LocationFeedback = {
  tone: "info" | "error";
  text: string;
};

type LocationCoverageState =
  | {
      status: "idle";
    }
  | {
      status: "checking";
      locationKey: string;
    }
  | {
      status: "valid";
      locationKey: string;
      areaLabel: string;
    }
  | {
      status: "invalid";
      locationKey: string;
      code: BonusDeliveryCoverageCode;
    };

const initialFormData = {
  name: "",
  mobile: "",
  address: "",
};

const LOCATION_CHECKING_ERROR =
  "Please wait while we confirm that pinned location.";

const getLocationCoverageKey = (location: Coordinates): string =>
  getRoundedBonusDeliveryLocationKey(location, 5);

const isValidatedLocation = (
  location: Coordinates | null,
  locationCoverage: LocationCoverageState,
): boolean =>
  Boolean(
    location &&
      locationCoverage.status === "valid" &&
      locationCoverage.locationKey === getLocationCoverageKey(location),
  );

const BonusLocationPicker = dynamic(() => import("./BonusLocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="bonus-location-map animate-pulse rounded-[1.5rem] bg-slate-100" />
  ),
});

const formatCountdown = (remainingMs: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatTimestamp = (value: string): string =>
  new Date(value).toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function BonusClaimPageClient({
  token,
}: BonusClaimPageClientProps) {
  const [status, setStatus] = useState<BonusLinkStatus | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState<string>("");
  const [isOpening, setIsOpening] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimedState, setClaimedState] = useState<BonusLinkClaimedStatus | null>(
    null,
  );
  const [mapCenter, setMapCenter] = useState<Coordinates>(BONUS_DELIVERY_MAP_CENTER);
  const [pinnedLocation, setPinnedLocation] = useState<Coordinates | null>(null);
  const [locationFeedback, setLocationFeedback] = useState<LocationFeedback | null>(
    null,
  );
  const [locationCoverage, setLocationCoverage] = useState<LocationCoverageState>({
    status: "idle",
  });
  const [isLocating, setIsLocating] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const locationValidationRequestIdRef = useRef(0);

  const activateLink = useEffectEvent(async () => {
    if (!isValidBonusLinkKey(token)) {
      setStatus({ status: "invalid" });
      setIsOpening(false);
      return;
    }

    setIsOpening(true);
    setRequestError("");

    try {
      const response = await fetch("/api/bonus-links/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: token }),
      });

      const nextStatus = (await response.json().catch(() => null)) as
        | BonusLinkStatus
        | { error?: string }
        | null;

      if (!response.ok && (!nextStatus || !("status" in nextStatus))) {
        throw new Error(
          nextStatus?.error || "We could not activate your bonus claim link.",
        );
      }

      if (nextStatus && "status" in nextStatus) {
        setStatus(nextStatus);
        if (
          nextStatus.status === "claimable" &&
          nextStatus.recipientName &&
          !formData.name
        ) {
          setFormData((prev) => ({ ...prev, name: nextStatus.recipientName ?? "" }));
        }
      } else {
        throw new Error("We could not activate your bonus claim link.");
      }
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "We could not activate your bonus claim link.",
      );
    } finally {
      setIsOpening(false);
    }
  });

  useEffect(() => {
    void activateLink();
  }, [token]);

  useEffect(() => {
    if (status?.status !== "claimable") return;

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status?.status]);

  const effectiveStatus: BonusLinkStatus = (() => {
    if (claimedState) return claimedState;
    if (!status) return { status: "invalid" };

    if (status.status !== "claimable") {
      return status;
    }

    const expiresAtMs = Date.parse(status.claimExpiresAt);
    if (Number.isNaN(expiresAtMs) || nowMs >= expiresAtMs) {
      return {
        status: "expired",
        openedAt: status.openedAt,
        claimExpiresAt: status.claimExpiresAt,
      };
    }

    return {
      ...status,
      remainingMs: expiresAtMs - nowMs,
    };
  })();

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const nextErrors = { ...prev };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const updateField = (field: keyof typeof initialFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const validatePinnedLocation = async (nextLocation: Coordinates) => {
    const requestId = locationValidationRequestIdRef.current + 1;
    const locationKey = getLocationCoverageKey(nextLocation);

    locationValidationRequestIdRef.current = requestId;
    setPinnedLocation(nextLocation);
    clearFieldError("location");
    setLocationCoverage({
      status: "checking",
      locationKey,
    });
    setLocationFeedback({
      tone: "info",
      text: "Checking whether this pin is inside our delivery area...",
    });

    try {
      const response = await fetch("/api/bonus-links/coverage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: nextLocation,
        }),
      });

      const responseBody = (await response.json().catch(() => null)) as
        | BonusDeliveryCoverageResult
        | { error?: string }
        | null;

      if (locationValidationRequestIdRef.current !== requestId) {
        return;
      }

      if (!response.ok && (!responseBody || !("ok" in responseBody))) {
        throw new Error(
          responseBody?.error || "We could not validate that pinned location.",
        );
      }

      if (!responseBody || !("ok" in responseBody)) {
        throw new Error("We could not validate that pinned location.");
      }

      if (responseBody.ok) {
        setLocationCoverage({
          status: "valid",
          locationKey,
          areaLabel: responseBody.areaLabel,
        });
        clearFieldError("location");
        setLocationFeedback({
          tone: "info",
          text: `Delivery coverage confirmed for ${responseBody.areaLabel}. You can continue with your claim.`,
        });
        return;
      }

      const errorText = getBonusDeliveryCoverageFailureMessage(responseBody.code);
      setLocationCoverage({
        status: "invalid",
        locationKey,
        code: responseBody.code,
      });
      setFieldErrors((prev) => ({
        ...prev,
        location: errorText,
      }));
      setLocationFeedback(null);
    } catch {
      if (locationValidationRequestIdRef.current !== requestId) {
        return;
      }

      setLocationCoverage({
        status: "invalid",
        locationKey,
        code: "unverifiable_location",
      });
      setFieldErrors((prev) => ({
        ...prev,
        location: BONUS_DELIVERY_UNVERIFIABLE_ERROR,
      }));
      setLocationFeedback(null);
    }
  };

  const updatePinnedLocation = (nextLocation: Coordinates) => {
    void validatePinnedLocation(nextLocation);
  };

  const handleRejectedMapSelection = () => {
    const hasValidLocation = isValidatedLocation(pinnedLocation, locationCoverage);

    if (hasValidLocation) {
      setLocationFeedback({
        tone: "error",
        text: BONUS_DELIVERY_OUTSIDE_SERVICE_AREA_ERROR,
      });
      return;
    }

    setFieldErrors((prev) => ({
      ...prev,
      location: BONUS_DELIVERY_OUTSIDE_SERVICE_AREA_ERROR,
    }));
    setLocationFeedback(null);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationFeedback({
        tone: "error",
        text: "Location access is not available in this browser. You can still place the pin manually.",
      });
      return;
    }

    setIsLocating(true);
    setLocationFeedback(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (!isWithinBonusDeliveryBounds(nextLocation)) {
          const hasValidLocation = isValidatedLocation(
            pinnedLocation,
            locationCoverage,
          );

          if (hasValidLocation) {
            setLocationFeedback({
              tone: "error",
              text: BONUS_DELIVERY_OUTSIDE_SERVICE_AREA_ERROR,
            });
          } else {
            setFieldErrors((prev) => ({
              ...prev,
              location: BONUS_DELIVERY_OUTSIDE_SERVICE_AREA_ERROR,
            }));
            setLocationFeedback(null);
          }

          setIsLocating(false);
          return;
        }

        setMapCenter(nextLocation);
        void validatePinnedLocation(nextLocation);
        setIsLocating(false);
      },
      (error) => {
        const errorText =
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. You can still place the pin manually on the map."
            : error.code === error.TIMEOUT
              ? "Getting your current location took too long. Try again or place the pin manually."
              : "We could not access your current location. You can still place the pin manually.";

        setLocationFeedback({
          tone: "error",
          text: errorText,
        });
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  const validateForm = (): boolean => {
    const nextErrors: FieldErrors = {};
    const normalizedName = formData.name.trim();
    const normalizedMobile = formData.mobile.trim();
    const normalizedAddress = formData.address.trim();
    const hasValidPinnedLocation = isValidatedLocation(
      pinnedLocation,
      locationCoverage,
    );

    if (!normalizedName) {
      nextErrors.name = "Please enter the recipient name.";
    }

    if (!BONUS_LINK_MOBILE_REGEX.test(normalizedMobile)) {
      nextErrors.mobile = "Please enter a valid PH mobile number (09xxxxxxxxx).";
    }

    if (!normalizedAddress) {
      nextErrors.address = "Please enter the full shipping address.";
    }

    if (!pinnedLocation) {
      nextErrors.location = BONUS_DELIVERY_REQUIRED_ERROR;
    } else if (locationCoverage.status === "checking") {
      nextErrors.location = LOCATION_CHECKING_ERROR;
    } else if (!hasValidPinnedLocation) {
      nextErrors.location =
        locationCoverage.status === "invalid"
          ? getBonusDeliveryCoverageFailureMessage(locationCoverage.code)
          : BONUS_DELIVERY_REQUIRED_ERROR;
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || effectiveStatus.status !== "claimable") return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setRequestError("");

    try {
      const response = await fetch("/api/bonus-links/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: token,
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
          address: formData.address.trim(),
          location: pinnedLocation,
        }),
      });

      const responseBody = (await response.json().catch(() => null)) as
        | (BonusLinkStatus & { fieldErrors?: FieldErrors; error?: string })
        | { fieldErrors?: FieldErrors; error?: string }
        | null;

      if (response.ok && responseBody && "status" in responseBody) {
        if (responseBody.status === "claimed") {
          setClaimedState(responseBody);
          return;
        }
        setStatus(responseBody);
        return;
      }

      if (responseBody?.fieldErrors) {
        setFieldErrors(responseBody.fieldErrors);
      }

      if (responseBody && "status" in responseBody) {
        setStatus(responseBody);
        if (responseBody.status !== "claimable") {
          return;
        }
      }

      throw new Error(
        responseBody?.error || "We could not submit your shipping details.",
      );
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "We could not submit your shipping details.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageState = isOpening
    ? "opening"
    : claimedState
      ? "complete"
      : effectiveStatus.status;

  const headingText =
    pageState === "opening"
      ? "Preparing your one-time bonus claim."
      : pageState === "claimable"
        ? "Claim your Free Bonus: A Panatag Home's Mug."
        : pageState === "complete"
          ? "Your free mug is on its way."
          : pageState === "claimed"
            ? "This bonus link has already been claimed."
            : pageState === "expired"
              ? "This bonus link has expired."
              : "This bonus link is not available.";

  const subheadingText =
    pageState === "opening"
      ? "We are validating your one-time link and preparing the shipping form."
      : pageState === "claimable"
        ? "Your one-time shipping window is active. Enter your shipping details before the timer runs out."
        : pageState === "complete"
          ? "We received your shipping details for your mug shipment."
          : pageState === "claimed"
            ? "This one-time shipment was already used, so the link is now closed."
            : pageState === "expired"
              ? "The one-hour claim window ended before the shipping form was completed."
              : "Please contact Safely Secured Homes if you believe this link should still work.";

  const heroTitle =
    pageState === "opening" || pageState === "claimable"
      ? "Free Bonus: A Panatag Home's Mug with one-time shipping."
      : pageState === "complete"
        ? "Mug claim confirmed."
        : pageState === "claimed"
          ? "Mug shipment already claimed."
          : pageState === "expired"
            ? "Claim window closed."
            : "Bonus link unavailable.";

  const heroSubtitle =
    pageState === "opening" || pageState === "claimable"
      ? "Complete the form before the claim window expires."
      : pageState === "complete"
        ? "Your shipping details have been recorded successfully."
        : pageState === "claimed"
          ? "This one-time link was already used and cannot be reopened."
          : pageState === "expired"
            ? "The one-hour access window has ended for this link."
            : "This token is invalid, incomplete, or no longer available.";

  const formFieldClassName = (hasError: boolean) =>
    `mt-2 w-full rounded-2xl border bg-white px-5 py-4 text-base text-[#2D3748] shadow-sm outline-none transition focus-visible:ring-4 placeholder:text-slate-400 ${
      hasError
        ? "border-red-500 focus-visible:ring-red-100"
        : "border-[#D8DDE3] focus-visible:border-[#0E79B2] focus-visible:ring-[#0E79B2]/15"
    }`;

  const summaryLabel = claimedState
    ? "Claim complete"
    : effectiveStatus.status === "claimed"
      ? "Already claimed"
      : effectiveStatus.status === "expired"
        ? "Link expired"
        : "Link unavailable";

  const summaryTitle = claimedState
    ? "Shipping details received."
    : effectiveStatus.status === "claimed"
      ? "This mug shipment was already claimed."
      : effectiveStatus.status === "expired"
        ? "The one-hour claim window has ended."
        : "We could not activate this bonus link.";

  const summaryBody = claimedState
    ? `Thank you${
        claimedState.shippingName ? `, ${claimedState.shippingName}` : ""
      }. We stored your shipping details on ${formatTimestamp(
        claimedState.claimedAt,
      )}.`
    : effectiveStatus.status === "claimed"
      ? `This one-time claim was completed on ${formatTimestamp(
          effectiveStatus.claimedAt,
        )}.`
      : effectiveStatus.status === "expired"
        ? effectiveStatus.claimExpiresAt
          ? `This link expired on ${formatTimestamp(
              effectiveStatus.claimExpiresAt,
            )}.`
          : "This link is no longer active."
        : "This token is invalid, incomplete, or no longer available.";

  const details = claimedState
    ? [
        {
          label: "Claimed on",
          value: formatTimestamp(claimedState.claimedAt),
        },
        {
          label: "Recipient",
          value: claimedState.shippingName ?? "Shipping details received",
        },
      ]
    : effectiveStatus.status === "claimed"
      ? [
          {
            label: "Claimed on",
            value: formatTimestamp(effectiveStatus.claimedAt),
          },
          {
            label: "Recipient",
            value: effectiveStatus.shippingName ?? "Shipping details received",
          },
        ]
      : effectiveStatus.status === "expired"
        ? [
            {
              label: "Opened",
              value: effectiveStatus.openedAt
                ? formatTimestamp(effectiveStatus.openedAt)
                : "Not available",
            },
            {
              label: "Expired",
              value: effectiveStatus.claimExpiresAt
                ? formatTimestamp(effectiveStatus.claimExpiresAt)
                : "Not available",
            },
          ]
        : [];

  const claimCardContent = isOpening ? (
    <div className="mx-auto max-w-3xl text-center">
      <div className="inline-flex rounded-full bg-[#F1F7FB] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#0E79B2]">
        Activating link
      </div>
      <h2 className="mt-5 text-2xl font-bold text-[#1F2937] sm:text-3xl">
        Preparing your bonus claim page.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
        We are checking this one-time link and starting the claim window if it is
        still available.
      </p>
      <div className="mt-8 space-y-5 text-left">
        <div className="rounded-3xl border border-[#DCE6F1] bg-[#F0F9FF] p-6">
          <div className="h-3 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-12 w-36 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-14 animate-pulse rounded-full bg-slate-200" />
      </div>
    </div>
  ) : effectiveStatus.status === "claimable" ? (
    <div className="space-y-8">
      <div className="rounded-3xl border border-[#BEE9E8] bg-[#F0F9FF] p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#0E79B2]">
              Claim window active
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-[#1F2937] sm:text-5xl">
              {formatCountdown(effectiveStatus.remainingMs)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Complete the shipping form before the one-time timer runs out.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
            <div className="rounded-2xl bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Activated
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-[#1F2937]">
                {formatTimestamp(effectiveStatus.openedAt)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Expires
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-[#1F2937]">
                {formatTimestamp(effectiveStatus.claimExpiresAt)}
              </p>
            </div>
          </div>
        </div>
        {effectiveStatus.note && (
          <p className="mt-4 rounded-2xl bg-white/90 px-4 py-3 text-sm leading-relaxed text-slate-600">
            {effectiveStatus.note}
          </p>
        )}
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Shipping details
          </p>
          <h2 className="mt-3 text-2xl font-bold text-[#1F2937] sm:text-3xl">
            Complete your one-time claim.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
            Use the recipient name, mobile number, and full address so the bonus
            shipment can be processed correctly.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="bonus-name"
              className="text-sm font-semibold text-[#1F2937]"
            >
              Recipient name
            </label>
            <input
              id="bonus-name"
              type="text"
              autoComplete="name"
              maxLength={80}
              value={formData.name}
              onChange={(event) => updateField("name", event.target.value)}
              className={formFieldClassName(Boolean(fieldErrors.name))}
              placeholder="Full recipient name"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="bonus-mobile"
              className="text-sm font-semibold text-[#1F2937]"
            >
              Contact number
            </label>
            <input
              id="bonus-mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={11}
              value={formData.mobile}
              onChange={(event) => updateField("mobile", event.target.value)}
              className={formFieldClassName(Boolean(fieldErrors.mobile))}
              placeholder="09xxxxxxxxx"
            />
            {fieldErrors.mobile && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.mobile}</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[#DCE6F1] bg-[#F8FBFD] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E79B2]">
                Pin your location
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[#1F2937]">
                Pin your delivery location.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Place a pin inside Metro Manila or CALABARZON. You still need to
                type the full shipping address below before submitting the claim.
              </p>
            </div>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center justify-center rounded-full border border-[#0E79B2]/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0E79B2] transition-colors hover:border-[#0E79B2] hover:bg-[#F0F9FF] disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            >
              {isLocating ? "Locating..." : "Use My Current Location"}
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[#DCE6F1] bg-white">
            <BonusLocationPicker
              center={mapCenter}
              value={pinnedLocation}
              onChange={updatePinnedLocation}
              onInvalidSelection={handleRejectedMapSelection}
            />
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs leading-relaxed text-slate-500">
              Tap anywhere on the map to place a pin, then drag the pin to fine-tune
              the spot. The pin is checked to confirm that the delivery location is
              inside Metro Manila or CALABARZON. Only your typed shipping address
              is stored with the claim.
            </p>

            {pinnedLocation && (
              <p className="text-xs font-medium text-slate-600">
                Pinned coordinates: {pinnedLocation.lat.toFixed(5)},{" "}
                {pinnedLocation.lng.toFixed(5)}
              </p>
            )}

            {fieldErrors.location && (
              <p className="text-xs text-red-500">{fieldErrors.location}</p>
            )}

            {locationFeedback && (
              <p
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  locationFeedback.tone === "error"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-[#BEE9E8] bg-[#F0F9FF] text-[#0E79B2]"
                }`}
              >
                {locationFeedback.text}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="bonus-address"
            className="text-sm font-semibold text-[#1F2937]"
          >
            Shipping address
          </label>
          <textarea
            id="bonus-address"
            rows={5}
            autoComplete="street-address"
            value={formData.address}
            onChange={(event) => updateField("address", event.target.value)}
            className={`${formFieldClassName(Boolean(fieldErrors.address))} min-h-[180px] resize-y`}
            placeholder="House number, street, barangay, city, province, and any delivery notes"
          />
          {fieldErrors.address && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.address}</p>
          )}
        </div>

        {requestError && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {requestError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || locationCoverage.status === "checking"}
          className="inline-flex w-full items-center justify-center rounded-full bg-[#0E79B2] px-10 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#0E79B2]/25 transition-all hover:-translate-y-0.5 hover:bg-[#0b5e8b] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
        >
          {isSubmitting
            ? "Submitting your shipping details..."
            : locationCoverage.status === "checking"
              ? "Checking your pinned location..."
            : "Claim My Free Bonus"}
        </button>

        <p className="text-center text-xs text-slate-500">
          JavaScript is required so the one-time timer can be enforced correctly
          on this page.
        </p>
      </form>
    </div>
  ) : (
    <div className="mx-auto max-w-3xl text-center">
      <div className="inline-flex rounded-full bg-[#F1F7FB] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#0E79B2]">
        {summaryLabel}
      </div>
      <h2 className="mt-5 text-2xl font-bold text-[#1F2937] sm:text-3xl">
        {summaryTitle}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
        {summaryBody}
      </p>

      {details.length > 0 && (
        <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="rounded-2xl bg-[#F8FBFD] p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {detail.label}
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-[#1F2937]">
                {detail.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {requestError && (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
          {requestError}
        </p>
      )}

      <div className="mt-6 rounded-3xl border border-[#DCE6F1] bg-[#F8FBFD] p-5 text-left text-sm leading-relaxed text-slate-600">
        Need help with this mug shipment? Contact Safely Secured Homes directly
        so the team can verify whether a replacement link is appropriate.
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#2D3748]">
      <header className="container mx-auto flex items-center justify-center px-6 pb-6 pt-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/assets/img/Logo/navbar banner.png"
            alt="Safely Secured Homes"
            width={210}
            height={48}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
      </header>

      <main className="container mx-auto px-6 pb-16 pt-2 sm:pt-4 lg:pb-24">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              One-time mug shipment
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-[#2D3748] sm:text-4xl lg:text-5xl">
              {headingText}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:mt-4 sm:text-lg">
              {subheadingText}
            </p>
          </div>

          <div className="max-w-5xl mx-auto w-full">
            <div className="relative aspect-7/4 w-full overflow-hidden rounded-4xl border border-white bg-[#0B1724] shadow-2xl shadow-[#0E79B2]/15">
              <video
                className="h-full w-full object-cover"
                aria-hidden="true"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                tabIndex={-1}
              >
                <source src={BONUS_LINK_VIDEO_URL} type="video/mp4" />
              </video>
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-left sm:bottom-6 sm:left-6 sm:right-6">
                <p className="text-base font-semibold text-white sm:text-xl">
                  {heroTitle}
                </p>
                <p className="mt-1 text-xs text-white/80 sm:text-sm">
                  {heroSubtitle}
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-[2rem] border border-white bg-white p-6 shadow-2xl shadow-[#0E79B2]/10 sm:p-8">
            {claimCardContent}
          </section>

          <section className="mt-2">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                How this link works
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#1F2937] sm:text-3xl">
                A simple three-step claim flow.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                This bonus link opens once, stays active for one hour, and closes
                automatically after a successful claim.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="rounded-3xl border border-[#DCE6F1] bg-white p-6 shadow-[0_18px_40px_rgba(14,121,178,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E79B2]">
                  Step 1
                </p>
                <h3 className="mt-3 text-lg font-semibold text-[#1F2937]">
                  Open the link
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Opening this page starts a one-hour claim window for this
                  one-time link.
                </p>
              </article>
              <article className="rounded-3xl border border-[#DCE6F1] bg-white p-6 shadow-[0_18px_40px_rgba(14,121,178,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E79B2]">
                  Step 2
                </p>
                <h3 className="mt-3 text-lg font-semibold text-[#1F2937]">
                  Submit shipping details
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Enter the recipient name, mobile number, and full shipping
                  address.
                </p>
              </article>
              <article className="rounded-3xl border border-[#DCE6F1] bg-white p-6 shadow-[0_18px_40px_rgba(14,121,178,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E79B2]">
                  Step 3
                </p>
                <h3 className="mt-3 text-lg font-semibold text-[#1F2937]">
                  Link closes automatically
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Once claimed, the link is immediately closed and cannot be
                  reused.
                </p>
              </article>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

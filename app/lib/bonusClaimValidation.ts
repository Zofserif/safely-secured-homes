import { BONUS_LINK_MOBILE_REGEX } from "./bonusClaimLinks.ts";
import {
  BONUS_DELIVERY_REQUIRED_ERROR,
  getBonusDeliveryCoverageFailureMessage,
  parseBonusDeliveryCoordinates,
  type BonusDeliveryCoordinates,
  type BonusDeliveryCoverageResult,
} from "./bonusDeliveryCoverage.ts";

export type BonusClaimFieldErrors = Partial<
  Record<"name" | "mobile" | "address" | "location", string>
>;

type GetBonusClaimFieldErrorsOptions = {
  name: string;
  mobile: string;
  address: string;
  location: unknown;
  validateBonusDeliveryLocation: (
    location: BonusDeliveryCoordinates,
  ) => Promise<BonusDeliveryCoverageResult>;
};

export const getBonusClaimFieldErrors = async ({
  name,
  mobile,
  address,
  location,
  validateBonusDeliveryLocation,
}: GetBonusClaimFieldErrorsOptions): Promise<BonusClaimFieldErrors> => {
  const fieldErrors: BonusClaimFieldErrors = {};
  const parsedLocation = parseBonusDeliveryCoordinates(location);

  if (!name) {
    fieldErrors.name = "Please enter the recipient name.";
  }

  if (!BONUS_LINK_MOBILE_REGEX.test(mobile)) {
    fieldErrors.mobile = "Please enter a valid PH mobile number (09xxxxxxxxx).";
  }

  if (!address) {
    fieldErrors.address = "Please enter the full shipping address.";
  }

  if (!parsedLocation) {
    fieldErrors.location = BONUS_DELIVERY_REQUIRED_ERROR;
    return fieldErrors;
  }

  const coverageResult = await validateBonusDeliveryLocation(parsedLocation);

  if (!coverageResult.ok) {
    fieldErrors.location = getBonusDeliveryCoverageFailureMessage(
      coverageResult.code,
    );
  }

  return fieldErrors;
};

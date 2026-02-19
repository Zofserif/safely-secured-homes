import type { ResultActionPolicy } from "./types";

export const RESULTS_PHONE_NUMBER = "09959959229";
export const RESULTS_CALL_HREF = `tel:${RESULTS_PHONE_NUMBER}`;
export const RESULTS_BOOK_VISIT_URL = "https://calendly.com/vallarta-troy/30min";

export const RESULT_ACTION_POLICY: ResultActionPolicy = {
  Hot: ["primary_book", "common_call"],
  Warm: ["primary_book", "common_diy"],
  Nurture: ["primary_call", "common_diy"],
};

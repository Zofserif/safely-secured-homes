type TestimonialCandidate = {
  review?: string | null;
};

const MIN_REVIEW_LENGTH = 24;
const MIN_REVIEW_WORDS = 5;
const MIN_LETTER_COUNT = 12;
const PLACEHOLDER_PATTERNS = [
  /^(test|testing|sample|demo|placeholder)\b/i,
  /\blorem ipsum\b/i,
  /\b(asdf|qwer|zxcv)\b/i,
  /testignagasdga/i,
];

const normalizeReview = (value: string) => value.trim().replace(/\s+/g, " ");

export const isHighSignalReview = (value: string | null | undefined) => {
  const review = normalizeReview(value ?? "");
  if (!review) return false;
  if (review.length < MIN_REVIEW_LENGTH) return false;

  const wordCount = review.split(" ").filter(Boolean).length;
  if (wordCount < MIN_REVIEW_WORDS) return false;

  const letterCount = (review.match(/[a-z]/gi) ?? []).length;
  if (letterCount < MIN_LETTER_COUNT) return false;

  if (/(.)\1{5,}/i.test(review)) return false;
  if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(review))) return false;

  return true;
};

export const isHighSignalTestimonial = <T extends TestimonialCandidate>(item: T) =>
  isHighSignalReview(item.review);

export const filterHighSignalTestimonials = <T extends TestimonialCandidate>(
  items: T[]
) => items.filter((item) => isHighSignalTestimonial(item));

const hasLetter = (value: string): boolean => /[a-z]/i.test(value);

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const normalizeFirstName = (value: string): string => {
  const firstToken = value
    .trim()
    .split(/\s+/)
    .find((token) => token.length > 0);
  if (!firstToken) return "";

  const lowerToken = firstToken.toLowerCase();
  return `${lowerToken.charAt(0).toUpperCase()}${lowerToken.slice(1)}`;
};

export const resolveFirstName = (value: string): string =>
  normalizeFirstName(value) || "there";

export const deriveFirstNameFromEmail = (email: string): string => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return "";

  const atIndex = normalizedEmail.indexOf("@");
  const localPart =
    atIndex === -1 ? normalizedEmail : normalizedEmail.slice(0, atIndex);
  if (!localPart) return "";

  const plusIndex = localPart.indexOf("+");
  const baseLocalPart =
    plusIndex === -1 ? localPart : localPart.slice(0, plusIndex);
  if (!baseLocalPart) return "";

  const firstToken = baseLocalPart
    .split(/[._\-\s]+/)
    .map((token) => token.trim())
    .find((token) => token.length > 0 && hasLetter(token));

  return normalizeFirstName(firstToken ?? "");
};

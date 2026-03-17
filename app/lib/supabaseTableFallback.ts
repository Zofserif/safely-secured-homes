export type SupabaseTableError = {
  code?: string | null;
  details?: string | null;
  message?: string | null;
};

export const isMissingSupabaseTableError = (
  error: SupabaseTableError | null | undefined,
  tableName: string,
) => {
  const code = `${error?.code ?? ""}`.trim();
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`
    .trim()
    .toLowerCase();
  const normalizedTableName = tableName.trim().toLowerCase();

  if (!message) {
    return code === "42P01" || code === "PGRST205";
  }

  if (code === "42P01" || code === "PGRST205") {
    return true;
  }

  return (
    message.includes(normalizedTableName) &&
    (message.includes("does not exist") ||
      message.includes("schema cache") ||
      message.includes("could not find"))
  );
};

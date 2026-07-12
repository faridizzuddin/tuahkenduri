export function friendlyError(error: unknown, fallback = "Sesuatu tidak berjaya. Sila cuba lagi.") {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "";
  if (message.includes("duplicate key") || message.includes("unique constraint")) return "Nombor ini sudah wujud.";
  return message || fallback;
}

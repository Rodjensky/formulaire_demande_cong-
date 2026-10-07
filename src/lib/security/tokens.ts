/**
 * Secure token generation and hashing utilities using Web Crypto API.
 */

export function generateSecureToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashToken(token: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(token));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateRequestNumber(sequenceNumber: number, year = new Date().getFullYear()): string {
  const padded = String(sequenceNumber).padStart(4, "0");
  return `CONG-${year}-${padded}`;
}

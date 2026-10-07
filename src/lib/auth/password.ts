/**
 * Edge- and Node.js-compatible password hashing using Web Crypto API (PBKDF2 + SHA-256).
 * Zero native binary dependencies, runs natively on Cloudflare Workers edge runtime.
 */

const ITERATIONS = 100_000;
const KEY_LENGTH = 32; // 256 bits

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    KEY_LENGTH * 8
  );

  const saltHex = bufferToHex(salt.buffer);
  const hashHex = bufferToHex(derivedBits);

  return `pbkdf2:${ITERATIONS}:${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") {
      return false;
    }

    const iterations = parseInt(parts[1], 10);
    const salt = hexToBuffer(parts[2]);
    const expectedHashHex = parts[3];

    const enc = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt as any,
        iterations: iterations,
        hash: "SHA-256",
      },
      passwordKey,
      KEY_LENGTH * 8
    );

    const actualHashHex = bufferToHex(derivedBits);
    return actualHashHex === expectedHashHex;
  } catch (err) {
    return false;
  }
}

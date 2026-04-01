/**
 * lib/utils/encryption.ts
 * AES-256-GCM encryption for sensitive fields
 * Used for: bank account numbers, IFSC, Aadhaar numbers
 *
 * Key: 32-byte key from ENCRYPTION_KEY env variable
 * Algorithm: AES-256-GCM (authenticated encryption)
 * Output format: base64(iv:authTag:ciphertext)
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;    // 96 bits — recommended for GCM
const TAG_LENGTH = 128;  // bits

/**
 * Import the encryption key from environment variable
 */
async function getKey(): Promise<CryptoKey> {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be set as 64-character hex string (32 bytes)"
    );
  }

  const keyBytes = hexToBytes(keyHex);
  return crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as ArrayBuffer,
    { name: ALGORITHM },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a plaintext string
 * Returns: base64 encoded string containing IV + ciphertext + auth tag
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    encoded
  );

  // Combine IV + ciphertext (GCM auth tag is appended by SubtleCrypto)
  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.length);

  return bytesToBase64(combined);
}

/**
 * Decrypt an encrypted string
 * Input: base64 string from encrypt()
 * Returns: original plaintext
 */
export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getKey();
  const combined = base64ToBytes(ciphertext);

  const iv = combined.slice(0, IV_LENGTH);
  const cipher = combined.slice(IV_LENGTH);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    cipher
  );

  return new TextDecoder().decode(plainBuffer);
}

/**
 * Hash a value for searchability without storing plaintext
 * Uses SHA-256 — one-way, not reversible
 * Useful for: searching by last 4 digits of account number
 */
export async function hashForSearch(value: string): Promise<string> {
  const salt = process.env.SEARCH_HASH_SALT ?? "tcsion-default-salt";
  const input = new TextEncoder().encode(salt + value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", input);
  return bytesToBase64(new Uint8Array(hashBuffer));
}

/**
 * Mask a sensitive value for display (e.g. "XXXX XXXX 1234")
 */
export function maskAccountNumber(account: string): string {
  if (account.length <= 4) return "****";
  const visible = account.slice(-4);
  const masked = "*".repeat(Math.min(account.length - 4, 12));
  return `${masked}${visible}`;
}

export function maskIfsc(ifsc: string): string {
  if (ifsc.length <= 4) return "****";
  return `${ifsc.slice(0, 4)}${"*".repeat(ifsc.length - 4)}`;
}

// ── Utilities

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a secure random encryption key (run once, store in env)
 * Usage: node -e "require('./lib/utils/encryption').generateKey()"
 */
export function generateKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(key).map((b) => b.toString(16).padStart(2, "0")).join("");
}

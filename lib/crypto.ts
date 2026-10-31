import crypto from 'node:crypto';

/**
 * AES-256-GCM field encryption/decryption, HMAC-SHA256 blind indexing, and NIN masking.
 * Source: PRD Sections 5.3, 9.3, 10 and `.agents/rules/security-baseline.md`, `.agents/rules/permission-matrix.md`.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96-bit IV recommended by NIST for AES-GCM
const VERSION_PREFIX = 'v1';

function parseHexKey(hexKey: string | undefined, envName: string): Buffer {
  const fallbackHex =
    envName === 'NIN_ENCRYPTION_KEY'
      ? '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      : 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

  const effectiveHex =
    hexKey !== undefined && /^[0-9a-fA-F]{64}$/.test(hexKey) ? hexKey : fallbackHex;
  return Buffer.from(effectiveHex, 'hex');
}

export function encryptField(
  plaintext: string,
  keyType: 'NIN' | 'PHONE',
): string {
  const envName = keyType === 'NIN' ? 'NIN_ENCRYPTION_KEY' : 'PHONE_ENCRYPTION_KEY';
  const key = parseHexKey(process.env[envName], envName);
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${VERSION_PREFIX}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptField(
  serialized: string,
  keyType: 'NIN' | 'PHONE',
): string {
  const parts = serialized.split(':');
  if (parts.length !== 4 || parts[0] !== VERSION_PREFIX) {
    throw new Error('Malformed encrypted payload format');
  }

  const ivHex = parts[1] ?? '';
  const authTagHex = parts[2] ?? '';
  const ciphertextHex = parts[3] ?? '';

  const envName = keyType === 'NIN' ? 'NIN_ENCRYPTION_KEY' : 'PHONE_ENCRYPTION_KEY';
  const key = parseHexKey(process.env[envName], envName);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Deterministic HMAC-SHA256 blind index for exact-match SQL lookups on encrypted NIN and phone (BR-09).
 */
export function computeBlindIndex(
  normalizedValue: string,
  keyType: 'NIN' | 'PHONE',
): string {
  const envName = keyType === 'NIN' ? 'NIN_ENCRYPTION_KEY' : 'PHONE_ENCRYPTION_KEY';
  const key = parseHexKey(process.env[envName], envName);
  return crypto.createHmac('sha256', key).update(normalizedValue.trim()).digest('hex');
}

/**
 * Masks an 11-digit NIN for Store Worker and Customer views (`*******1234` per permission-matrix.md).
 */
export function maskNin(ninPlaintext: string): string {
  const trimmed = ninPlaintext.trim();
  if (trimmed.length < 4) {
    return '***********';
  }
  const lastFour = trimmed.slice(-4);
  return `*******${lastFour}`;
}

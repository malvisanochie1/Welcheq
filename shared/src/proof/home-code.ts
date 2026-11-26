import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import { ROTATING_CODE } from '../constants/proof';

const COUNTER_BYTES = 8;
const DYNAMIC_OFFSET_MASK = 0x0f;
const SIGN_BIT_MASK = 0x7fffffff;

function counterFor(instant: Date): number {
  return Math.floor(instant.getTime() / 1000 / ROTATING_CODE.PERIOD_SECONDS);
}

function counterBytes(counter: number): Uint8Array {
  const bytes = new Uint8Array(COUNTER_BYTES);
  new DataView(bytes.buffer).setBigUint64(0, BigInt(counter));
  return bytes;
}

/** HOTP-style truncation (RFC 4226) over HMAC-SHA256, so codes can be shown offline. */
function codeForCounter(secretHex: string, counter: number): string {
  const digest = hmac(sha256, hexToBytes(secretHex), counterBytes(counter));
  const offset = (digest[digest.length - 1] ?? 0) & DYNAMIC_OFFSET_MASK;
  const binary = new DataView(digest.buffer, digest.byteOffset).getUint32(offset) & SIGN_BIT_MASK;
  return String(binary % 10 ** ROTATING_CODE.DIGITS).padStart(ROTATING_CODE.DIGITS, '0');
}

export function homeCodeAt(secretHex: string, instant: Date): string {
  return codeForCounter(secretHex, counterFor(instant));
}

export function secondsUntilNextHomeCode(instant: Date): number {
  const elapsed = Math.floor(instant.getTime() / 1000) % ROTATING_CODE.PERIOD_SECONDS;
  return ROTATING_CODE.PERIOD_SECONDS - elapsed;
}

/** Accepts the code for the given moment and one period either side, for slow typing or drift. */
export function isValidHomeCode(secretHex: string, code: string, instant: Date): boolean {
  const counter = counterFor(instant);
  for (
    let drift = -ROTATING_CODE.ACCEPTED_DRIFT_PERIODS;
    drift <= ROTATING_CODE.ACCEPTED_DRIFT_PERIODS;
    drift += 1
  ) {
    if (codeForCounter(secretHex, counter + drift) === code) {
      return true;
    }
  }
  return false;
}

export const homeCodeSecretToHex = bytesToHex;

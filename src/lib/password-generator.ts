import { randomInt } from "node:crypto";
import { MIN_PASSWORD_LENGTH, isPasswordComplexityOk } from "./password-policy.js";

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const DIGIT = "23456789";
const SPECIAL = "!@#$%^&*-_+=?";
const ALL = UPPER + LOWER + DIGIT + SPECIAL;

function pickChar(alphabet: string): string {
  const ch = alphabet[randomInt(0, alphabet.length)];

  if (ch === undefined) {
    throw new Error("Empty alphabet");
  }

  return ch;
}

function shuffleInPlace(arr: string[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    const ai = arr[i];
    const aj = arr[j];

    if (ai === undefined || aj === undefined) continue;

    arr[i] = aj;
    arr[j] = ai;
  }
}

export function generateStrongPassword(length: number = 20): string {
  const targetLength = Math.max(length, MIN_PASSWORD_LENGTH);

  for (let attempt = 0; attempt < 5; attempt++) {
    const chars: string[] = [pickChar(UPPER), pickChar(LOWER), pickChar(DIGIT), pickChar(SPECIAL)];

    while (chars.length < targetLength) {
      chars.push(pickChar(ALL));
    }

    shuffleInPlace(chars);

    const candidate = chars.join("");

    if (isPasswordComplexityOk(candidate)) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a complex password");
}

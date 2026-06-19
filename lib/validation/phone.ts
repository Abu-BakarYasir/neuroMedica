// Phone-number validation for patient forms.
//
// We accept international-friendly formatting characters (digits, spaces, "+",
// "-", "(", ")", ".") but reject letters and other junk, and require a sane
// number of actual digits.

const ALLOWED_CHARS = /^[0-9+\-()\s.]+$/;
const MIN_DIGITS = 7;
const MAX_DIGITS = 15; // E.164 maximum

/** Count the numeric digits in a phone string. */
export function countDigits(value: string): number {
  return (value.match(/\d/g) ?? []).length;
}

/**
 * Validate a phone number. Empty/whitespace is considered valid here because
 * the field is optional — callers requiring a value should check separately.
 * Returns an error message string, or null when valid.
 */
export function validatePhone(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null; // optional field

  if (!ALLOWED_CHARS.test(trimmed)) {
    return "Phone number can only contain digits and + - ( ) . characters.";
  }
  const digits = countDigits(trimmed);
  if (digits < MIN_DIGITS) {
    return `Phone number must have at least ${MIN_DIGITS} digits.`;
  }
  if (digits > MAX_DIGITS) {
    return `Phone number can have at most ${MAX_DIGITS} digits.`;
  }
  return null;
}

/** Convenience boolean wrapper around {@link validatePhone}. */
export function isValidPhone(value: string | null | undefined): boolean {
  return validatePhone(value) === null;
}

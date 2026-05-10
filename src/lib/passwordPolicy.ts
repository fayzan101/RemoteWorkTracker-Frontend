/**
 * Matches backend `registerUserSchema` in organization.validation.ts
 * (min 8 + complexity regex).
 */
export const ORG_USER_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/;

/** Human-readable requirements for UI copy. */
export const ORG_USER_PASSWORD_REQUIREMENTS =
  'At least 8 characters, including uppercase, lowercase, a number, and one of: ! @ # $ % ^ & *';

/**
 * @returns `null` if valid, otherwise an error message for the user.
 */
export function getOrgUserPasswordError(password: string): string | null {
  const trimmed = password.trim();
  if (!trimmed) {
    return 'Password is required.';
  }
  if (trimmed.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!ORG_USER_PASSWORD_REGEX.test(trimmed)) {
    return `Password must include uppercase, lowercase, a number, and one special character from: !@#$%^&*`;
  }
  return null;
}

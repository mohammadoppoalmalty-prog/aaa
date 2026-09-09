/**
 * Class-name join.
 *
 * `noUncheckedIndexedAccess` correctly types a CSS-module lookup as possibly
 * undefined — a typo in a class name is a real bug, and this is the one place
 * that fact gets handled instead of asserted away.
 */
export const cls = (...parts: readonly (string | false | null | undefined)[]): string =>
  parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');

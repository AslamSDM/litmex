/**
 * Cookie utilities for storing and retrieving data in browser cookies
 */

/**
 * Sets a cookie with the given name and value
 * @param name The name of the cookie
 * @param value The value to store
 * @param days Number of days until the cookie expires
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 5 / 24
): void {
  // Only run in browser environment
  if (typeof window === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(
    value
  )};expires=${expires.toUTCString()};path=/`;
}

/**
 * Gets a cookie value by name
 * @param name The name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  // Only run in browser environment
  if (typeof window === "undefined") return null;

  const nameEQ = `${name}=`;
  const ca = document.cookie.split(";");

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }

  return null;
}

/**
 * Deletes a cookie by name
 * @param name The name of the cookie to delete
 */
export function deleteCookie(name: string): void {
  // Only run in browser environment
  if (typeof window === "undefined") return;

  // Set expiration to past date to delete the cookie
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

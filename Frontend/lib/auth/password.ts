/**
 * Password hashing utilities using bcrypt
 * For admin authentication with secure password storage
 */

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // High iterations for security

/**
 * Hash a plain-text password with bcrypt
 * @param password - Plain-text password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password with a hashed password
 * @param password - Plain-text password to verify
 * @param hash - Hashed password to compare against
 * @returns Promise resolving to true if match, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and message
 */
export function validatePasswordStrength(
  password: string
): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain number' };
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return { valid: false, message: 'Password must contain special character (!@#$%^&*)' };
  }
  return { valid: true };
}

/**
 * Generate a temporary password for admin reset
 * Format: Temp@XXXXXX (where X is random digit)
 * @returns Temporary password
 */
export function generateTemporaryPassword(): string {
  const randomDigits = Math.random().toString().slice(2, 8).padEnd(6, '0');
  return `Temp@${randomDigits}`;
}

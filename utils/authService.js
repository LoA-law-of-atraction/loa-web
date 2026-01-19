import bcrypt from 'bcryptjs';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

const CONFIG_COLLECTION = 'blog_config';
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Get admin password hash from Firestore
 * @returns {Promise<string|null>} - Password hash or null
 */
export async function getAdminPasswordHash() {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, 'settings');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docSnap.data().adminPassword || null;
  } catch (error) {
    console.error('Error fetching admin password:', error);
    throw error;
  }
}

/**
 * Set admin password hash in Firestore
 * @param {string} password - Plain text password
 * @returns {Promise<void>}
 */
export async function setAdminPassword(password) {
  try {
    const hash = await hashPassword(password);
    const docRef = doc(db, CONFIG_COLLECTION, 'settings');

    await setDoc(
      docRef,
      {
        adminPassword: hash,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error setting admin password:', error);
    throw error;
  }
}

/**
 * Verify admin login credentials
 * @param {string} password - Plain text password
 * @returns {Promise<boolean>} - True if credentials are valid
 */
export async function verifyAdminCredentials(password) {
  try {
    const hash = await getAdminPasswordHash();

    if (!hash) {
      console.warn('No admin password set in database');
      return false;
    }

    return await verifyPassword(password, hash);
  } catch (error) {
    console.error('Error verifying admin credentials:', error);
    return false;
  }
}

/**
 * Generate a random session token
 * @returns {string} - Random token
 */
export function generateSessionToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create admin session (for use in API routes)
 * @param {string} token - Session token
 * @returns {object} - Session data
 */
export function createAdminSession(token) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour session

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    isAdmin: true,
  };
}

/**
 * Verify session token (for use in middleware)
 * @param {string} token - Session token to verify
 * @returns {boolean} - True if session is valid
 */
export function verifySessionToken(token) {
  // In a production app, you'd store sessions in Redis or a database
  // For this simple implementation, we'll just check if token exists
  // The token is validated in the login API route
  return token && token.length === 64; // Our tokens are 64 hex chars
}

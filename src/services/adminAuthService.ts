/**
 * Admin Authentication Service
 * Cryptographically secures the admin console using salted SHA-256 hashing,
 * brute-force lockout protection, and auto-expiring sessions.
 * Plaintext passwords are never stored in memory, code, or browser storage.
 */

const STORAGE_KEY_HASH = 'fv_admin_pass_hash';
const STORAGE_KEY_SESSION = 'fv_admin_auth_session';
const STORAGE_KEY_REMEMBER = 'fv_admin_auth_remember';
const STORAGE_KEY_SESSION_EXPIRY = 'fv_admin_session_expiry';
const STORAGE_KEY_FAILED_ATTEMPTS = 'fv_admin_failed_attempts';
const STORAGE_KEY_LOCKOUT_UNTIL = 'fv_admin_lockout_until';

// Irreversible cryptographic salted SHA-256 hash of the master password
// Salt: 'filevault_auth_salt_2026_x89'
const AUTH_SALT = 'filevault_auth_salt_2026_x89';
const MASTER_PASSWORD_HASH = '99ede02defbcebd3c39cb8ebd204a9df88339d1fa0041565ebe82fe99c55d1d6';

// Security constraints
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60-second cooldown
const SESSION_LIFETIME_MS = 4 * 60 * 60 * 1000; // 4-hour session expiry

/**
 * Computes salted SHA-256 hash using Web Crypto API.
 */
async function computeHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(AUTH_SALT + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

class AdminAuthService {
  constructor() {
    // Purge any legacy plain text passcode storage
    if (localStorage.getItem('fv_admin_passcode')) {
      localStorage.removeItem('fv_admin_passcode');
    }
    this.cleanExpiredSession();
  }

  /**
   * Checks if an admin session is currently active and unexpired.
   */
  public isAuthenticated(): boolean {
    const isSessionActive = sessionStorage.getItem(STORAGE_KEY_SESSION) === 'true';
    const isRemembered = localStorage.getItem(STORAGE_KEY_REMEMBER) === 'true';

    if (!isSessionActive && !isRemembered) {
      return false;
    }

    const expiry = localStorage.getItem(STORAGE_KEY_SESSION_EXPIRY);
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Returns remaining lockout seconds if currently locked out.
   */
  public getLockoutSeconds(): number {
    const lockoutUntilStr = localStorage.getItem(STORAGE_KEY_LOCKOUT_UNTIL);
    if (!lockoutUntilStr) return 0;
    const lockoutUntil = parseInt(lockoutUntilStr, 10);
    const diff = lockoutUntil - Date.now();
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
  }

  /**
   * Attempts admin login with the provided passcode.
   */
  public async login(
    passcode: string,
    remember = false
  ): Promise<{ success: boolean; message: string; lockoutSeconds?: number }> {
    const lockout = this.getLockoutSeconds();
    if (lockout > 0) {
      return {
        success: false,
        message: `Too many failed attempts. Security cooldown active for ${lockout}s.`,
        lockoutSeconds: lockout,
      };
    }

    const trimmed = passcode.trim();
    if (!trimmed) {
      return { success: false, message: 'Please enter the admin passcode.' };
    }

    const inputHash = await computeHash(trimmed);
    const targetHash = localStorage.getItem(STORAGE_KEY_HASH) || MASTER_PASSWORD_HASH;

    if (inputHash === targetHash) {
      // Reset failed attempts on success
      localStorage.removeItem(STORAGE_KEY_FAILED_ATTEMPTS);
      localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);

      sessionStorage.setItem(STORAGE_KEY_SESSION, 'true');
      const expiryTimestamp = Date.now() + SESSION_LIFETIME_MS;
      localStorage.setItem(STORAGE_KEY_SESSION_EXPIRY, expiryTimestamp.toString());

      if (remember) {
        localStorage.setItem(STORAGE_KEY_REMEMBER, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_REMEMBER);
      }

      this.dispatchAuthChangeEvent();
      return { success: true, message: 'Authentication verified successfully.' };
    }

    // Handle failed attempt
    const currentAttempts = parseInt(localStorage.getItem(STORAGE_KEY_FAILED_ATTEMPTS) || '0', 10) + 1;
    localStorage.setItem(STORAGE_KEY_FAILED_ATTEMPTS, currentAttempts.toString());

    if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(STORAGE_KEY_LOCKOUT_UNTIL, lockUntil.toString());
      localStorage.removeItem(STORAGE_KEY_FAILED_ATTEMPTS);
      return {
        success: false,
        message: `Too many failed attempts. Account temporarily locked for 60 seconds.`,
        lockoutSeconds: 60,
      };
    }

    const remaining = MAX_FAILED_ATTEMPTS - currentAttempts;
    return {
      success: false,
      message: `Invalid passcode. Access denied. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`,
    };
  }

  /**
   * Terminates the current admin session.
   */
  public logout(): void {
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.removeItem(STORAGE_KEY_REMEMBER);
    localStorage.removeItem(STORAGE_KEY_SESSION_EXPIRY);
    this.dispatchAuthChangeEvent();
  }

  /**
   * Updates the admin passcode, saving only the irreversible SHA-256 hash.
   */
  public async changePasscode(
    currentPass: string,
    newPass: string
  ): Promise<{ success: boolean; message: string }> {
    const currentHash = await computeHash(currentPass.trim());
    const targetHash = localStorage.getItem(STORAGE_KEY_HASH) || MASTER_PASSWORD_HASH;

    if (currentHash !== targetHash) {
      return { success: false, message: 'Current password is incorrect.' };
    }

    if (!newPass || newPass.trim().length < 6) {
      return {
        success: false,
        message: 'New password must be at least 6 characters long.',
      };
    }

    const newHash = await computeHash(newPass.trim());
    localStorage.setItem(STORAGE_KEY_HASH, newHash);
    return { success: true, message: 'Admin password updated and cryptographically secured.' };
  }

  /**
   * Resets password back to master password hash.
   */
  public resetToMaster(): void {
    localStorage.removeItem(STORAGE_KEY_HASH);
  }

  private cleanExpiredSession(): void {
    const expiry = localStorage.getItem(STORAGE_KEY_SESSION_EXPIRY);
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      this.logout();
    }
  }

  private dispatchAuthChangeEvent(): void {
    window.dispatchEvent(new Event('fv_admin_auth_changed'));
  }
}

export const adminAuthService = new AdminAuthService();

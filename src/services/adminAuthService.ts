/**
 * Admin Authentication Service
 * Restricts the admin console from normal visitors.
 */

const STORAGE_KEY_PASSCODE = 'fv_admin_passcode';
const STORAGE_KEY_SESSION = 'fv_admin_auth_session';
const STORAGE_KEY_REMEMBER = 'fv_admin_auth_remember';

const DEFAULT_PASSCODE = 'admin123';

class AdminAuthService {
  private currentPasscode: string;

  constructor() {
    this.currentPasscode = localStorage.getItem(STORAGE_KEY_PASSCODE) || DEFAULT_PASSCODE;
  }

  /**
   * Checks if an admin session is currently active.
   */
  public isAuthenticated(): boolean {
    const isSessionActive = sessionStorage.getItem(STORAGE_KEY_SESSION) === 'true';
    const isRemembered = localStorage.getItem(STORAGE_KEY_REMEMBER) === 'true';
    return isSessionActive || isRemembered;
  }

  /**
   * Attempts admin login with the provided passcode.
   */
  public login(passcode: string, remember = false): { success: boolean; message: string } {
    const trimmed = passcode.trim();
    const targetPasscode = localStorage.getItem(STORAGE_KEY_PASSCODE) || DEFAULT_PASSCODE;

    if (!trimmed) {
      return { success: false, message: 'Please enter the admin passcode.' };
    }

    if (trimmed === targetPasscode) {
      sessionStorage.setItem(STORAGE_KEY_SESSION, 'true');
      if (remember) {
        localStorage.setItem(STORAGE_KEY_REMEMBER, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_REMEMBER);
      }
      this.dispatchAuthChangeEvent();
      return { success: true, message: 'Authentication successful.' };
    }

    return { success: false, message: 'Invalid passcode. Access denied.' };
  }

  /**
   * Terminates the current admin session.
   */
  public logout(): void {
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.removeItem(STORAGE_KEY_REMEMBER);
    this.dispatchAuthChangeEvent();
  }

  /**
   * Updates the admin passcode.
   */
  public changePasscode(
    currentPass: string,
    newPass: string
  ): { success: boolean; message: string } {
    const targetPasscode = localStorage.getItem(STORAGE_KEY_PASSCODE) || DEFAULT_PASSCODE;

    if (currentPass.trim() !== targetPasscode) {
      return { success: false, message: 'Current passcode is incorrect.' };
    }

    if (!newPass || newPass.trim().length < 4) {
      return {
        success: false,
        message: 'New passcode must be at least 4 characters long.',
      };
    }

    localStorage.setItem(STORAGE_KEY_PASSCODE, newPass.trim());
    this.currentPasscode = newPass.trim();
    return { success: true, message: 'Admin passcode updated successfully.' };
  }

  /**
   * Returns default passcode for reference.
   */
  public getDefaultPasscode(): string {
    return DEFAULT_PASSCODE;
  }

  private dispatchAuthChangeEvent(): void {
    window.dispatchEvent(new Event('fv_admin_auth_changed'));
  }
}

export const adminAuthService = new AdminAuthService();

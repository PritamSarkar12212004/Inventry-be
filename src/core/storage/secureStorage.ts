import * as Keychain from 'react-native-keychain';

const AUTH_SERVICE = 'wishbox_auth_tokens';
const PROFILE_SERVICE = 'wishbox_profile_completed';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

let cachedTokens: AuthTokens | null | undefined;

export const secureStorage = {
  async saveTokens(tokens: AuthTokens): Promise<void> {
    cachedTokens = tokens;
    await Keychain.setGenericPassword('auth_tokens', JSON.stringify(tokens), {
      service: AUTH_SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  },

  async getTokens(): Promise<AuthTokens | null> {
    if (cachedTokens !== undefined) {
      return cachedTokens;
    }

    const credentials = await Keychain.getGenericPassword({
      service: AUTH_SERVICE,
    });

    if (!credentials) {
      cachedTokens = null;
      return null;
    }

    try {
      cachedTokens = JSON.parse(credentials.password) as AuthTokens;
      return cachedTokens;
    } catch {
      cachedTokens = null;
      return null;
    }
  },

  async clearTokens(): Promise<void> {
    cachedTokens = null;
    await Keychain.resetGenericPassword({
      service: AUTH_SERVICE,
    });
  },

  async setProfileCompleted(completed: boolean): Promise<void> {
    if (completed) {
      await Keychain.setGenericPassword('profile_done', 'true', {
        service: PROFILE_SERVICE,
        accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      });
    } else {
      await Keychain.resetGenericPassword({ service: PROFILE_SERVICE });
    }
  },

  async isProfileCompleted(): Promise<boolean> {
    const credentials = await Keychain.getGenericPassword({
      service: PROFILE_SERVICE,
    });
    return credentials !== false && credentials.password === 'true';
  },
};

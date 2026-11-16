import * as Keychain from 'react-native-keychain';

const AUTH_SERVICE = 'wishbox_auth_tokens';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export const secureStorage = {
  async saveTokens(tokens: AuthTokens): Promise<void> {
    await Keychain.setGenericPassword('auth_tokens', JSON.stringify(tokens), {
      service: AUTH_SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  },

  async getTokens(): Promise<AuthTokens | null> {
    const credentials = await Keychain.getGenericPassword({
      service: AUTH_SERVICE,
    });

    if (!credentials) {
      return null;
    }

    try {
      return JSON.parse(credentials.password) as AuthTokens;
    } catch {
      return null;
    }
  },

  async clearTokens(): Promise<void> {
    await Keychain.resetGenericPassword({
      service: AUTH_SERVICE,
    });
  },
};

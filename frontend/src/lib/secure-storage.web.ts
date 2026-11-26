/** Browsers have no hardware keystore; session storage limits exposure to the open tab. */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    return globalThis.sessionStorage?.getItem(key) ?? null;
  },

  async setItem(key: string, value: string): Promise<void> {
    globalThis.sessionStorage?.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    globalThis.sessionStorage?.removeItem(key);
  },
};

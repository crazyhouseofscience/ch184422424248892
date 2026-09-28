// Safe Storage helper that works everywhere, including local file:/// URLs,
// restricted school sandbox iframes, and private browsing modes without throwing SecurityError.

const memoryStorage = new Map<string, string>();

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // SecurityError or restricted environment
    }
    return memoryStorage.get(`local:${key}`) ?? null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // SecurityError or restricted environment
    }
    memoryStorage.set(`local:${key}`, value);
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // SecurityError
    }
    memoryStorage.delete(`local:${key}`);
  }
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch {
      // SecurityError
    }
    return memoryStorage.get(`session:${key}`) ?? null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
        return;
      }
    } catch {
      // SecurityError
    }
    memoryStorage.set(`session:${key}`, value);
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
        return;
      }
    } catch {
      // SecurityError
    }
    memoryStorage.delete(`session:${key}`);
  }
};

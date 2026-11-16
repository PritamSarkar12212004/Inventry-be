export function createModuleLogger(moduleName: string) {
  const prefix = `[${moduleName.toUpperCase()}]`;

  return {
    info: (event: string, payload?: unknown) => {
      if (__DEV__) {
        console.log(`${prefix} ${event}`, payload ?? '');
      }
    },
    warn: (event: string, payload?: unknown) => {
      if (__DEV__) {
        console.warn(`${prefix} ${event}`, payload ?? '');
      }
    },
    error: (event: string, error?: unknown) => {
      if (__DEV__) {
        console.error(`${prefix} ${event}`, error ?? '');
      }
    },
  };
}

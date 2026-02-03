
/**
 * Utility functions for converting between camelCase and snake_case
 */

export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

export const snakeToCamel = (str: string): string => {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
};

export const mapKeysToCamel = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map((v) => mapKeysToCamel(v));
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [snakeToCamel(key)]: mapKeysToCamel(obj[key]),
      }),
      {}
    );
  }
  return obj;
};

export const mapKeysToSnake = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map((v) => mapKeysToSnake(v));
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [camelToSnake(key)]: mapKeysToSnake(obj[key]),
      }),
      {}
    );
  }
  return obj;
};


/**
 * Robust Arabic text normalization for comparison
 */
export const normalizeArabic = (text: string): string => {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ')
    // Normalize Alef
    .replace(/[أإآ]/g, 'ا')
    // Normalize Teh Marbuta
    .replace(/ة/g, 'ه')
    // Normalize Yeh
    .replace(/ى/g, 'ي')
    // Remove Harakat (Diacritics)
    .replace(/[\u064B-\u0652]/g, '');
};

/**
 * Compare two Arabic strings after normalization
 */
export const compareArabic = (str1: string, str2: string): boolean => {
  return normalizeArabic(str1) === normalizeArabic(str2);
};

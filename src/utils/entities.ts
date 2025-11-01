/**
 * A map of characters to their corresponding HTML entities for encoding.
 */
const entityMap: { [key: string]: string; } = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;',
  "'": '&#39;',
  "/": "&#x2F;",
};

/**
 * A regular expression to find characters that need to be encoded.
 */
const encodeRegex = /[&<>"'/]/g;

/**
 * Encodes a string to its HTML entity representation.
 * @param str The string to encode.
 * @returns The encoded string.
 */
export function encode(str: string): string
{
  if (typeof str !== "string") return "";
  return str.replace(encodeRegex, (s) => entityMap[s]);
}

/**
 * A map of HTML entities to their corresponding characters for decoding.
 */
const decodeEntityMap: { [key: string]: string; } = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  '&quot;': '"',
  '&#39;': "'",
  "&#x2F;": "/",
};

/**
 * A regular expression to find HTML entities that need to be decoded.
 */
const decodeRegex = /&amp;|&lt;|&gt;|&quot;|&#39;|&#x2F;/g;

/**
 * Decodes an HTML entity string to its original representation.
 * @param str The string to decode.
 * @returns The decoded string.
 */
export function decode(str: string): string
{
  if (typeof str !== "string") return "";
  return str.replace(decodeRegex, (entity) => decodeEntityMap[entity]);
}

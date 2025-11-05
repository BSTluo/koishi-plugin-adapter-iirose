/**
 * 用于编码的字符到其对应HTML实体的映射。
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
 * 用于查找需要编码的字符的正则表达式。
 */
const encodeRegex = /[&<>"'/]/g;

/**
 * 将字符串编码为其HTML实体表示。
 * @param str 要编码的字符串。
 * @returns 编码后的字符串。
 */
export function encode(str: string): string
{
  if (typeof str !== "string") return "";
  return str.replace(encodeRegex, (s) => entityMap[s]);
}

/**
 * 用于解码的HTML实体到其对应字符的映射。
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
 * 用于查找需要解码的HTML实体的正则表达式。
 */
const decodeRegex = /&amp;|&lt;|&gt;|&quot;|&#39;|&#x2F;/g;

/**
 * 将HTML实体字符串解码为其原始表示。
 * @param str 要解码的字符串。
 * @returns 解码后的字符串。
 */
export function decode(str: string): string
{
  if (typeof str !== "string") return "";
  return str.replace(decodeRegex, (entity) => decodeEntityMap[entity]);
}

/**
 * 设置房间最大人数
 * @param num 人数 (可选, 不提供则无限制)
 * @returns {string}
 */
export default (num?: number) =>
{
  if (num) return `!h6["1${num}"]`;
  return '!h6["1"]';
};

/**
 * 切歌
 * @param id 媒体ID (可选, 不提供则切当前歌曲)
 * @returns {string}
 */
export default (id?: string) =>
{
  if (!id) return '!11';
  return `!12["${id}"]`;
};

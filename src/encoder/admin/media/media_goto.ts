/**
 * 跳转到媒体的指定时间点
 * @param time 时间点, 格式为 "mm:ss" 或秒数
 * @returns {string}
 */
export default (time: string) =>
{
  return `!16["${time}"]`;
};

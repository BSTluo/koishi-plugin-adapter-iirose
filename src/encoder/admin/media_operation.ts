/**
 * 对当前媒体进行快进或快退操作
 * @param operation 操作类型, '<' 为快退, '>' 为快进
 * @param time 时间，单位秒
 * @returns {string}
 */
export default (operation: '<' | '>', time: string) =>
{
  return `!15["${operation}","${time}"]`;
};

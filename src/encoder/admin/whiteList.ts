/**
 * 将用户添加到白名单
 * @param username 用户名
 * @param time 持续时间
 * @param intro 原因 (可选)
 * @returns {string}
 */
export default (username: string, time: string, intro?: string) =>
{
  return `!hw["4","${username}","${time}","${intro || 'undefined'}"]`;
};

/**
 * 发送房间公告
 * @param msg 公告内容
 * @returns {string}
 */
export default (msg: string) =>
{
  return `!!["${msg}"]`;
};

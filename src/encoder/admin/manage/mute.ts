/**
 * 禁言用户
 * @param type 禁言类型: 'chat' (聊天), 'music' (点歌), 'all' (聊天和点歌)
 * @param username 用户名
 * @param time 持续时间
 * @param intro 原因
 * @returns {string}
 */
export default (type: 'chat' | 'music' | 'all', username: string, time: string, intro: string) =>
{
  const typeMap: any = {
    chat: '41',
    music: '42',
    all: '43',
  };

  return `!h3["${typeMap[type]}","${username}","${time}","${intro}"]`;
};

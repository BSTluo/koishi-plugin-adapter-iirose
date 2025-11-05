/**
 * 交换两个媒体的位置
 * @param id1 媒体ID1
 * @param id2 媒体ID2
 * @returns {string}
 */
export default (id1: string, id2: string) =>
{
  return `!14["${id1}-${id2}"]`;
};

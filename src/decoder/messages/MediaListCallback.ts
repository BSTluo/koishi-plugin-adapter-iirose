import { decode } from '../../utils/entities';

export interface MediaListCallback
{
  id: string;
  length: number;
  title: string;
  color: string;
  name: string;
  type: number;
  avatar: string;
  cover: string;
}

/**
 * 解析媒体列表回调
 * @param message 消息
 * @returns {MediaListCallback[] | undefined}
 */
export const mediaListCallback = (message: string) =>
{
  if (message.substring(0, 1) === '~')
  {
    const result: MediaListCallback[] = message.substring(1).split('<').map((e, i) =>
    {
      const tmp = e.split('>');
      return {
        id: `${i}_${tmp[0]}`,
        length: Number(tmp[0]),
        title: decode(tmp[1]),
        color: tmp[2].substring(0, 6),
        name: tmp[2].substring(6),
        type: Number(tmp[3]),
        avatar: tmp[4],
        cover: `http${tmp[5]}`,
      };
    });
    // MediaListCallback
    return result;
  }
};

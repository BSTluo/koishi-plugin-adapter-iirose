import PublicMessage from './PublicMessage';

export default (type: 'music' | 'video', title: string, singer: string, cover: string, color: string, BitRate: number = 320, origin?: 'netease' | null) =>
{
  const typeMap = {
    music: "=0",
    video: "=1",
    netease: "@0"
  };
  let data: string;

  let t: string;
  if (origin)
  {
    t = origin;
  } else
  {
    t = type;
  }

  if (!BitRate)
  {
    data = `m__4${typeMap[t]}>${title}>${singer}>${cover}>${color}>11451`;
  } else
  {
    data = `m__4${typeMap[t]}>${title}>${singer}>${cover}>${color}>${BitRate}`;
  }

  return PublicMessage(data, color);
};

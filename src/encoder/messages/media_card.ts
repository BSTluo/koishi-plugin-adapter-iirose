import { musicOrigin } from '../../event';
import PublicMessage from './PublicMessage';
import { encode } from 'html-entities';

export default (type: 'music' | 'video', title: string, singer: string, cover: string, color: string, duration: number, BitRate: number = 320, origin?: musicOrigin['origin']) => {
  const typeMap = {
    music: "=0",
    video: "=1",
    netease: "@0",
    xiamimusic: "@1",
    qqmusic: "@2",
    qianqianmusic: "@3",
    kugoumusic: "@4",
    ximalayafm: "@5",
    lizhifm: "@6",
    echohuisheng: "@7",
    fivesing: "@8",
    iqiyi: "*0",
    tencentvideo: "*1",
    youtube: "*2",
    bilibili: "*3",
    mangotv: "*4",
    tiktok: "*5",
    kuaishou: "*6",
    onesixthreemv: "*7",
    bilibilistream: "*8"
  };
  let data: string;

  let t: string;
  if (origin && origin !== 'null' && origin !== 'undefined')
  {
    t = origin;
  } else
  {
    t = type;
  }

  title = encode(title);
  singer = encode(singer);
  color = encode(color);

  if (!BitRate)
  {
    data = `m__4${typeMap[t]}>${title}>${singer}>${cover}>${color}>>11451${formatSeconds(duration)}`;
  } else
  {
    data = `m__4${typeMap[t]}>${title}>${singer}>${cover}>${color}>>${BitRate}>>${formatSeconds(duration)}`;
  }
  return PublicMessage(data, color);
};

function formatSeconds(seconds: number): string {
  const minutes: number = Math.floor(seconds / 60);
  const remainingSeconds: number = seconds % 60;
  const formattedMinutes: string = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const formattedSeconds: string = remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;
  return `${formattedMinutes}:${formattedSeconds}`;
}
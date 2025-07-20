import { HTTP } from "koishi";
import { IIROSE_Bot } from './bot';
import FormData from 'form-data';
import { ReadStream } from 'fs';
import axios from "axios";

function formatCurrentTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function upload(http: HTTP, url: string, file: Buffer, config: IIROSE_Bot.Config)
{

  const formData = new FormData();
  
  formData.append('source', file, `${formatCurrentTime()}.jpeg`);
  formData.append('expiration', `PT${config.picKill}M`);
  formData.append('key', config.picToken);

  const data = await axios.post(`${url}/api/1/upload`, formData, {
    headers: {
      ...formData.getHeaders(),
      'X-API-Key': config.picToken,
      "Content-Type": "multipart/form-data",
    }
  });

  if (data.data.status_code != 200)
  {
    console.log(data.data)
    throw new Error('上传失败！请检查控制台');
  }

  return data.data.image.url;
}
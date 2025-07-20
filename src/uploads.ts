import { HTTP } from "koishi";
import { IIROSE_Bot } from './bot';
import FormData from 'form-data';
import { ReadStream } from 'fs';
import axios from "axios";

export async function upload(http: HTTP, url: string, file: Buffer, config: IIROSE_Bot.Config)
{

  const formData = new FormData();
  
  formData.append('source', file, "example.jpeg");
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
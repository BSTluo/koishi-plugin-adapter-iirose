import { HTTP } from "koishi";
import { IIROSE_Bot } from './bot';
import FormData from 'form-data';
import { ReadStream } from 'fs';
import axios from "axios";

export async function upload(http: HTTP, url: string, file: Buffer, config: IIROSE_Bot.Config)
{
  const imgToken = await axios.post(`${url}/images/tokens`, {
    num: 1,
    seconds: 60
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.picToken}`,
      'Accept': 'application/json'
    }
  });

  if (!imgToken.status) { return new Error('获取上传令牌失败'); }

  const token = imgToken.data.data.tokens[0].token;
  const formData = new FormData();

  formData.append('file', file, {
    filename: 'example.jpg',
    contentType: 'image/jpeg',
  });

  formData.append('token', token);

  const data = await axios.post(`${url}/upload`, formData, {
    headers: {
      ...formData.getHeaders(),
      'Authorization': `Bearer ${config.picToken}`,
      'Accept': 'application/json'
    }
  });

  if (!data.data.status)
  {
    throw new Error('上传失败');
  }
  if (!data.data.data)
  {
    const error = new Error(data.data.message || '上传失败');
    throw Object.assign(error, data);
  }

  setTimeout(async () =>
  {
    await axios.get(data.data.data.links.delete_url);
  }, 6000 * config.picKill);

  return data.data.data.links.url;
}
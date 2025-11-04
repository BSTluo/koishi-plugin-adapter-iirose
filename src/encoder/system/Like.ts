export default (uid: string, message: string = '') =>
{
  // 点赞功能
  let data = `+*${uid}`;
  if (message)
  {
    data += ` ${message}`;
  }
  return data;
};

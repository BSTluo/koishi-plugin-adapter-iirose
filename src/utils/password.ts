import md5 from 'md5';

/**
 * 检查密码是否为32位小写MD5格式
 */
export function isMd5Format(password: string): boolean
{
  return password && password.length === 32 && /^[a-z0-9]{32}$/.test(password);
}

/**
 * 获取密码的MD5值，如果已经是MD5格式则直接返回
 */
export function getMd5Password(password: string): string | null
{
  if (!password)
  {
    return null;
  }
  return isMd5Format(password) ? password : md5(password);
}

/**
 * 比较密码是否匹配目标MD5值
 */
export function comparePassword(password: string, targetMd5: string): boolean
{
  const passwordMd5 = getMd5Password(password);
  return passwordMd5 !== null && passwordMd5 === targetMd5;
}

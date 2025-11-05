/**
 * 获取银行信息
 * @returns {string}
 */
export const bankGet = (): string =>
{
  return '>*';
};

/**
 * 存款
 * @param amount 金额
 * @returns {string}
 */
export const bankDeposit = (amount: number): string =>
{
  return `>^a${amount}`;
};

/**
 * 取款
 * @param amount 金额
 * @returns {string}
 */
export const bankWithdraw = (amount: number): string =>
{
  return `>^b${amount}`;
};

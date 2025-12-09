const nocodbService = require('../services/nocodb.service');

const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const conditions = [];
    if (search) {
      conditions.push('(orderCode,like,%' + search + '%)~or(userName,like,%' + search + '%)');
    }
    if (status) {
      conditions.push('(status,eq,' + status + ')');
    }
    const where = conditions.length > 0 ? conditions.join('~and') : '';

    const result = await nocodbService.getRecords('transactions', {
      page: parseInt(page),
      limit: parseInt(limit),
      where,
      sort: '-Id',
    });

    const usernames = [...new Set((result.list || []).map(tx => tx.userName).filter(Boolean))];
    const userMap = {};
    if (usernames.length > 0) {
      try {
        const accountsResult = await nocodbService.getRecords('accounts', {
          page: 1,
          limit: 100,
          fields: 'userName,fullName',
        });
        (accountsResult.list || []).forEach(account => {
          if (account.userName) {
            userMap[account.userName] = { userName: account.userName, fullName: account.fullName || '' };
          }
        });
      } catch (err) { console.error('Failed to fetch user info:', err.message); }
    }

    const transformedList = (result.list || []).map(tx => {
      const username = tx.userName || '';
      const userInfo = userMap[username] || { userName: username, fullName: '' };
      let userDisplay = userInfo.userName || username || '-';
      if (userInfo.fullName && userInfo.fullName !== userInfo.userName) {
        userDisplay = userInfo.userName + ' (' + userInfo.fullName + ')';
      }
      return {
        Id: tx.Id, orderCode: tx.orderCode || '', userName: username,
        fullName: userInfo.fullName || '', userDisplay: userDisplay,
        amount: tx.amount || 0, description: tx.description || '',
        status: tx.status || 'pending', CreatedAt: tx.CreatedAt, UpdatedAt: tx.UpdatedAt,
      };
    });

    res.json({ success: true, data: { list: transformedList, pageInfo: result.pageInfo } });
  } catch (error) { next(error); }
};

const getTransactionStats = async (req, res, next) => {
  try {
    const result = await nocodbService.getRecords('transactions', { page: 1, limit: 1000, fields: 'Id,amount,status' });
    let totalAmount = 0, successfulTransactions = 0, pendingTransactions = 0;
    (result.list || []).forEach(tx => {
      if (tx.amount && tx.amount > 0) totalAmount += tx.amount;
      if (tx.status === 'PAID' || tx.status === 'success' || tx.status === 'completed') successfulTransactions++;
      else if (tx.status === 'pending' || tx.status === 'PENDING') pendingTransactions++;
    });
    res.json({ success: true, data: { totalTransactions: result.list?.length || 0, totalAmount, successfulTransactions, pendingTransactions } });
  } catch (error) { next(error); }
};

module.exports = { getTransactions, getTransactionStats };

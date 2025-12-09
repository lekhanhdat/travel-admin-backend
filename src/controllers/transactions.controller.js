const nocodbService = require('../services/nocodb.service');

// Transactions controller - read-only access to donation transaction history
// NocoDB table: md6twc3losjv4j3

// Get all transactions with pagination
const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;

    // Build where clause for search and status filter
    const conditions = [];
    if (search) {
      conditions.push('(orderCode,like,%' + search + '%)~or(fullName,like,%' + search + '%)~or(username,like,%' + search + '%)');
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

    // Get unique usernames to fetch user info
    const usernames = [...new Set((result.list || []).map(tx => tx.username).filter(Boolean))];
    
    // Fetch user info for all usernames
    const userMap = {};
    if (usernames.length > 0) {
      try {
        // Fetch accounts to get fullname for each username
        const accountsResult = await nocodbService.getRecords('accounts', {
          page: 1,
          limit: 100,
          fields: 'userName,fullName',
        });
        (accountsResult.list || []).forEach(account => {
          if (account.userName) {
            userMap[account.userName] = account.fullName || account.userName;
          }
        });
      } catch (err) {
        console.error('Failed to fetch user info:', err.message);
      }
    }

    // Transform data for frontend display
    const transformedList = (result.list || []).map(tx => {
      const username = tx.username || '';
      const fullName = tx.fullName || userMap[username] || username || '';
      return {
        Id: tx.Id,
        orderCode: tx.orderCode || '',
        username: username,
        fullName: fullName,
        amount: tx.amount || 0,
        description: tx.description || '',
        status: tx.status || 'pending',
        CreatedAt: tx.CreatedAt,
        UpdatedAt: tx.UpdatedAt,
      };
    });

    res.json({ success: true, data: { list: transformedList, pageInfo: result.pageInfo } });
  } catch (error) { next(error); }
};

// Get transaction statistics
const getTransactionStats = async (req, res, next) => {
  try {
    // Fetch all transactions to calculate stats
    const result = await nocodbService.getRecords('transactions', {
      page: 1,
      limit: 1000,
      fields: 'Id,amount,status'
    });

    let totalAmount = 0;
    let successfulTransactions = 0;
    let pendingTransactions = 0;

    (result.list || []).forEach(tx => {
      if (tx.amount && tx.amount > 0) {
        totalAmount += tx.amount;
      }
      if (tx.status === 'PAID' || tx.status === 'success' || tx.status === 'completed') {
        successfulTransactions++;
      } else if (tx.status === 'pending' || tx.status === 'PENDING') {
        pendingTransactions++;
      }
    });

    res.json({
      success: true,
      data: {
        totalTransactions: result.list?.length || 0,
        totalAmount,
        successfulTransactions,
        pendingTransactions,
      }
    });
  } catch (error) { next(error); }
};

module.exports = { getTransactions, getTransactionStats };

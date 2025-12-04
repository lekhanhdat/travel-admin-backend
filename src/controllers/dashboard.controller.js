const nocodbService = require('../services/nocodb.service');

// Get dashboard statistics
const getStats = async (req, res, next) => {
  try {
    const [locationsCount, festivalsCount, accountsCount, itemsCount] = await Promise.all([
      nocodbService.countRecords('locations'),
      nocodbService.countRecords('festivals'),
      nocodbService.countRecords('accounts'),
      nocodbService.countRecords('items'),
    ]);

    res.json({
      success: true,
      data: {
        locations: locationsCount,
        festivals: festivalsCount,
        accounts: accountsCount,
        items: itemsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get chart data
const getCharts = async (req, res, next) => {
  try {
    // Get all locations for type distribution
    const locations = await nocodbService.getRecords('locations', { limit: 1000 });
    const festivals = await nocodbService.getRecords('festivals', { limit: 1000 });
    const accounts = await nocodbService.getRecords('accounts', { limit: 1000 });

    // Location types distribution
    const typeCount = {};
    (locations.list || []).forEach(loc => {
      try {
        const types = JSON.parse(loc.types || '[]');
        types.forEach(type => {
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
      } catch (e) {
        // Skip if parsing fails
      }
    });
    const locationTypes = Object.entries(typeCount).map(([type, count]) => ({ type, count }));

    // Festivals by month
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const festivalsByMonth = monthNames.map((month, idx) => ({ month, count: 0 }));
    (festivals.list || []).forEach(fest => {
      if (fest.event_time) {
        const date = new Date(fest.event_time);
        if (!isNaN(date.getTime())) {
          festivalsByMonth[date.getMonth()].count++;
        }
      }
    });

    // User registrations (last 7 days)
    const userRegistrations = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = (accounts.list || []).filter(acc => {
        if (!acc.CreatedAt) return false;
        return acc.CreatedAt.startsWith(dateStr);
      }).length;
      userRegistrations.push({ date: dateStr, count });
    }

    res.json({
      success: true,
      data: {
        locationTypes,
        festivalsByMonth,
        userRegistrations,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getCharts,
};

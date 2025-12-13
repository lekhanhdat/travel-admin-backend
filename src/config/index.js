require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  nocodb: {
    baseUrl: process.env.NOCODB_BASE_URL || 'https://app.nocodb.com',
    apiToken: process.env.NOCODB_API_TOKEN,
    baseId: process.env.NOCODB_BASE_ID,
    tables: {
      accounts: process.env.ACCOUNTS_TABLE_ID || 'mad8fvjhd0ba1bk',
      locations: process.env.LOCATIONS_TABLE_ID || 'mfz84cb0t9a84jt',
      festivals: process.env.FESTIVALS_TABLE_ID || 'mktzgff8mpu2c32',
      items: process.env.ITEMS_TABLE_ID || 'mj77cy6909ll2wc',
      objects: process.env.OBJECTS_TABLE_ID || 'mj77cy6909ll2wc',
      transactions: process.env.TRANSACTIONS_TABLE_ID || 'md6twc3losjv4j3',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@travel.com',
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
  },
  passwordSalt: process.env.PASSWORD_SALT || 'TravelApp_Secret_Salt_2025',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
};

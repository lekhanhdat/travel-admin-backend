const axios = require('axios');
const config = require('../config');

class NocoDBService {
  constructor() {
    this.client = axios.create({
      baseURL: config.nocodb.baseUrl,
      timeout: 30000, // 30 second timeout
      headers: {
        'xc-token': config.nocodb.apiToken,
        'Content-Type': 'application/json',
      },
    });
    this.maxRetries = 3;
  }

  // Retry helper with exponential backoff
  async withRetry(operation, retries = this.maxRetries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt === retries;

        if (!isRetryable || isLastAttempt) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log('Retrying NocoDB request (attempt ' + (attempt + 1) + '/' + retries + ') after ' + delay + 'ms');
        await this.sleep(delay);
      }
    }
  }

  // Check if error is retryable
  isRetryableError(error) {
    // Network errors
    if (!error.response) {
      return true;
    }
    // Rate limiting (429) or server errors (5xx)
    const status = error.response.status;
    return status === 429 || (status >= 500 && status < 600);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getTableUrl(tableName) {
    const tableId = config.nocodb.tables[tableName];
    if (!tableId) {
      throw new Error('Unknown table: ' + tableName);
    }
    return '/api/v2/tables/' + tableId + '/records';
  }

  async getRecords(tableName, options = {}) {
    return this.withRetry(async () => {
      const { page = 1, limit = 25, where = '', sort = '', fields = '' } = options;
      const url = this.getTableUrl(tableName);
      const params = { offset: (page - 1) * limit, limit };
      if (where) params.where = where;
      if (sort) params.sort = sort;
      if (fields) params.fields = fields;
      const response = await this.client.get(url, { params });
      return response.data;
    });
  }

  async getRecordById(tableName, id) {
    return this.withRetry(async () => {
      const url = this.getTableUrl(tableName) + '/' + id;
      const response = await this.client.get(url);
      return response.data;
    });
  }

  async createRecord(tableName, data) {
    return this.withRetry(async () => {
      const url = this.getTableUrl(tableName);
      const response = await this.client.post(url, data);
      return response.data;
    });
  }

  // NocoDB v2 API: PATCH to /records with Id in request body
  async updateRecord(tableName, id, data) {
    return this.withRetry(async () => {
      const url = this.getTableUrl(tableName);
      const response = await this.client.patch(url, { Id: parseInt(id), ...data });
      return response.data;
    });
  }

  // NocoDB v2 API: DELETE to /records with array of {Id} in request body
  async deleteRecord(tableName, id) {
    return this.withRetry(async () => {
      const url = this.getTableUrl(tableName);
      const response = await this.client.delete(url, { data: [{ Id: parseInt(id) }] });
      return response.data;
    });
  }

  async countRecords(tableName, where = '') {
    return this.withRetry(async () => {
      const url = this.getTableUrl(tableName) + '/count';
      const params = where ? { where } : {};
      const response = await this.client.get(url, { params });
      return response.data.count;
    });
  }
}

module.exports = new NocoDBService();

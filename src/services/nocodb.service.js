const axios = require('axios');
const config = require('../config');

class NocoDBService {
  constructor() {
    this.client = axios.create({
      baseURL: config.nocodb.baseUrl,
      headers: {
        'xc-token': config.nocodb.apiToken,
        'Content-Type': 'application/json',
      },
    });
  }

  getTableUrl(tableName) {
    const tableId = config.nocodb.tables[tableName];
    if (!tableId) {
      throw new Error('Unknown table: ' + tableName);
    }
    return '/api/v2/tables/' + tableId + '/records';
  }

  async getRecords(tableName, options = {}) {
    const { page = 1, limit = 25, where = '', sort = '', fields = '' } = options;
    const url = this.getTableUrl(tableName);
    const params = { offset: (page - 1) * limit, limit };
    if (where) params.where = where;
    if (sort) params.sort = sort;
    if (fields) params.fields = fields;
    const response = await this.client.get(url, { params });
    return response.data;
  }

  // Fetch ALL records across all pages (NocoDB enforces max 100 per request)
  async getAllRecords(tableName, options = {}) {
    const { where = '', sort = '', fields = '' } = options;
    const url = this.getTableUrl(tableName);
    const pageSize = 100; // NocoDB max page size
    let allRecords = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const params = { offset, limit: pageSize };
      if (where) params.where = where;
      if (sort) params.sort = sort;
      if (fields) params.fields = fields;

      const response = await this.client.get(url, { params });
      const data = response.data;
      const records = data.list || [];
      allRecords = allRecords.concat(records);

      // Check if there are more pages
      hasMore = !data.pageInfo.isLastPage && records.length === pageSize;
      offset += pageSize;
    }

    return {
      list: allRecords,
      pageInfo: {
        totalRows: allRecords.length,
        page: 1,
        pageSize: allRecords.length,
        isFirstPage: true,
        isLastPage: true
      }
    };
  }

  async getRecordById(tableName, id) {
    const url = this.getTableUrl(tableName) + '/' + id;
    const response = await this.client.get(url);
    return response.data;
  }

  async createRecord(tableName, data) {
    const url = this.getTableUrl(tableName);
    const response = await this.client.post(url, data);
    return response.data;
  }

  // NocoDB v2 API: PATCH to /records with Id in request body
  async updateRecord(tableName, id, data) {
    const url = this.getTableUrl(tableName);
    const response = await this.client.patch(url, { Id: parseInt(id), ...data });
    return response.data;
  }

  // NocoDB v2 API: DELETE to /records with array of {Id} in request body
  async deleteRecord(tableName, id) {
    const url = this.getTableUrl(tableName);
    const response = await this.client.delete(url, { data: [{ Id: parseInt(id) }] });
    return response.data;
  }

  async countRecords(tableName, where = '') {
    const url = this.getTableUrl(tableName) + '/count';
    const params = where ? { where } : {};
    const response = await this.client.get(url, { params });
    return response.data.count;
  }
}

module.exports = new NocoDBService();

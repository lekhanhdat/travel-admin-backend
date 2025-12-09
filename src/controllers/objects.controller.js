const nocodbService = require('../services/nocodb.service');

// Objects controller - manages AI Recognition objects (Camera AI data)
// NocoDB table: mj77cy6909ll2wc (objects table with title, content fields)

// Get all objects with pagination, sorting, and filtering
const getObjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sort = 'Id', order = 'asc' } = req.query;

    // Build where clause for search
    const conditions = [];
    if (search) {
      conditions.push(`(title,like,%${search}%)~or(content,like,%${search}%)`);
    }
    const where = conditions.length > 0 ? conditions.join('~and') : '';

    // Build sort string
    const sortStr = order === 'desc' ? `-${sort}` : sort;

    const result = await nocodbService.getRecords('objects', {
      page: parseInt(page),
      limit: parseInt(limit),
      where,
      sort: sortStr,
    });

    res.json({ success: true, data: { list: result.list || [], pageInfo: result.pageInfo } });
  } catch (error) { next(error); }
};

// Get single object by ID
const getObjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const obj = await nocodbService.getRecordById('objects', id);
    if (!obj) {
      return res.status(404).json({ success: false, message: 'Object not found' });
    }
    res.json({ success: true, data: obj });
  } catch (error) { next(error); }
};

// Create new object
const createObject = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const objectData = {
      title: title.trim(),
      content: content || '',
    };

    const result = await nocodbService.createRecord('objects', objectData);
    res.status(201).json({ success: true, data: result, message: 'Object created successfully' });
  } catch (error) { next(error); }
};

// Update object
const updateObject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;

    const result = await nocodbService.updateRecord('objects', id, updateData);
    res.json({ success: true, data: result, message: 'Object updated successfully' });
  } catch (error) { next(error); }
};

// Delete object
const deleteObject = async (req, res, next) => {
  try {
    const { id } = req.params;
    await nocodbService.deleteRecord('objects', id);
    res.json({ success: true, message: 'Object deleted successfully' });
  } catch (error) { next(error); }
};

module.exports = { getObjects, getObjectById, createObject, updateObject, deleteObject };

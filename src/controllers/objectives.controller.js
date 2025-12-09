const nocodbService = require('../services/nocodb.service');

// Get all objectives/items with pagination, sorting, and filtering
const getObjectives = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sort = 'Id', order = 'asc', type = '' } = req.query;

    // Build where clause
    const conditions = [];
    if (search) conditions.push(`(name,like,%${search}%)`);
    if (type) conditions.push(`(type,eq,${type})`);
    const where = conditions.length > 0 ? conditions.join('~and') : '';

    // Build sort string
    const sortStr = order === 'desc' ? `-${sort}` : sort;

    const result = await nocodbService.getRecords('items', {
      page: parseInt(page),
      limit: parseInt(limit),
      where,
      sort: sortStr,
    });

    res.json({ success: true, data: { list: result.list || [], pageInfo: result.pageInfo } });
  } catch (error) { next(error); }
};

// Get single objective by ID
const getObjectiveById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await nocodbService.getRecordById('items', id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Objective not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

// Create new objective
const createObjective = async (req, res, next) => {
  try {
    const { name, type, description, points, image } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Name and type are required' });
    }
    
    const objectiveData = {
      name: name.trim(),
      type: type,
      description: description || '',
      points: points || 0,
      image: image || '',
    };

    const result = await nocodbService.createRecord('items', objectiveData);
    res.status(201).json({ success: true, data: result, message: 'Objective created successfully' });
  } catch (error) { next(error); }
};

// Update objective
const updateObjective = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, description, points, image } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (points !== undefined) updateData.points = points;
    if (image !== undefined) updateData.image = image;

    const result = await nocodbService.updateRecord('items', id, updateData);
    res.json({ success: true, data: result, message: 'Objective updated successfully' });
  } catch (error) { next(error); }
};

// Delete objective
const deleteObjective = async (req, res, next) => {
  try {
    const { id } = req.params;
    await nocodbService.deleteRecord('items', id);
    res.json({ success: true, message: 'Objective deleted successfully' });
  } catch (error) { next(error); }
};

module.exports = { getObjectives, getObjectiveById, createObjective, updateObjective, deleteObjective };

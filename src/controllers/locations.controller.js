const nocodbService = require('../services/nocodb.service');
const transformService = require('../services/transform.service');

// Calculate average rating from reviews
const calculateAverageRating = (reviewsJson) => {
  try {
    const reviews = JSON.parse(reviewsJson || '[]');
    if (!Array.isArray(reviews) || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + (r.start || r.rating || 0), 0);
    return Math.round((total / reviews.length) * 10) / 10; // Round to 1 decimal
  } catch { return 0; }
};

// Get all locations with pagination, sorting, and filtering
const getLocations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sort = 'Id', order = 'asc', types = '', hasMarker = '' } = req.query;
    
    // Build where clause
    const conditions = [];
    if (search) conditions.push(`(name,like,%${search}%)`);
    if (types) conditions.push(`(types,like,%${types}%)`);
    if (hasMarker === 'true') conditions.push('(marker,eq,true)');
    if (hasMarker === 'false') conditions.push('(marker,eq,false)');
    
    const where = conditions.length > 0 ? conditions.join('~and') : '';
    
    // Build sort string (default: ascending by Id)
    const sortStr = order === 'desc' ? `-${sort}` : sort;

    const result = await nocodbService.getRecords('locations', {
      page: parseInt(page),
      limit: parseInt(limit),
      where,
      sort: sortStr,
    });

    // Transform data for frontend display
    const transformedList = (result.list || []).map(loc => ({
      ...loc,
      types_display: transformService.arrayToComma(loc.types),
      images_display: transformService.arrayToNewline(loc.images),
      videos_display: transformService.arrayToNewline(loc.videos),
      advise_display: transformService.arrayToNewline(loc.advise),
      calculated_rating: calculateAverageRating(loc.reviews),
      review_count: transformService.parseJsonSafe(loc.reviews, []).length,
    }));

    res.json({ success: true, data: { list: transformedList, pageInfo: result.pageInfo } });
  } catch (error) { next(error); }
};

// Get single location by ID
const getLocationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const location = await nocodbService.getRecordById('locations', id);
    if (!location) return res.status(404).json({ success: false, message: 'Location not found' });

    const transformed = {
      ...location,
      types_display: transformService.arrayToComma(location.types),
      images_display: transformService.arrayToNewline(location.images),
      videos_display: transformService.arrayToNewline(location.videos),
      advise_display: transformService.arrayToNewline(location.advise),
      calculated_rating: calculateAverageRating(location.reviews),
    };
    res.json({ success: true, data: transformed });
  } catch (error) { next(error); }
};

// Create new location
const createLocation = async (req, res, next) => {
  try {
    const data = req.body;
    const transformed = {
      name: data.name,
      types: transformService.commaToArray(data.types),
      description: data.description || '',
      long_description: data.long_description || '',
      address: data.address || '',
      lat: parseFloat(data.lat) || 0,
      long: parseFloat(data.long) || 0,
      phone: data.phone || '',
      website: data.website || '',
      opening_hours: data.opening_hours || '',
      images: transformService.newlineToArray(data.images),
      videos: transformService.newlineToArray(data.videos),
      advise: transformService.newlineToArray(data.advise),
      marker: data.marker !== false,
      reviews: '[]',
    };
    const result = await nocodbService.createRecord('locations', transformed);
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
};

// Update location
const updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const transformed = {
      name: data.name,
      types: transformService.commaToArray(data.types),
      description: data.description || '',
      long_description: data.long_description || '',
      address: data.address || '',
      lat: parseFloat(data.lat) || 0,
      long: parseFloat(data.long) || 0,
      phone: data.phone || '',
      website: data.website || '',
      opening_hours: data.opening_hours || '',
      images: transformService.newlineToArray(data.images),
      videos: transformService.newlineToArray(data.videos),
      advise: transformService.newlineToArray(data.advise),
      marker: data.marker !== false,
    };
    const result = await nocodbService.updateRecord('locations', id, transformed);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

// Delete location
const deleteLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await nocodbService.deleteRecord('locations', id);
    res.json({ success: true, message: 'Location deleted successfully' });
  } catch (error) { next(error); }
};

// Toggle marker visibility
const toggleMarker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { marker } = req.body;
    const result = await nocodbService.updateRecord('locations', id, { marker });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

module.exports = { getLocations, getLocationById, createLocation, updateLocation, deleteLocation, toggleMarker };

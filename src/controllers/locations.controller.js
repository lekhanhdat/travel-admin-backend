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

    // Check if sorting by rating (calculated field - need client-side sort)
    const isRatingSort = sort === 'rating' || sort === 'calculated_rating';

    // If sorting by rating, fetch all records for client-side sorting
    const fetchLimit = isRatingSort ? 1000 : parseInt(limit);
    const fetchPage = isRatingSort ? 1 : parseInt(page);
    
    // For non-rating sorts, use NocoDB native sorting
    const sortStr = isRatingSort ? 'Id' : (order === 'desc' ? `-${sort}` : sort);

    const result = await nocodbService.getRecords('locations', {
      page: fetchPage,
      limit: fetchLimit,
      where,
      sort: sortStr,
    });

    // Transform data for frontend display
    let transformedList = (result.list || []).map(loc => ({
      ...loc,
      types_display: transformService.arrayToComma(loc.types),
      images_display: transformService.arrayToNewline(loc.images),
      videos_display: transformService.arrayToNewline(loc.videos),
      advise_display: transformService.arrayToNewline(loc.advise),
      calculated_rating: calculateAverageRating(loc.reviews),
      review_count: transformService.parseJsonSafe(loc.reviews, []).length,
    }));

    // If sorting by rating, apply client-side sorting with secondary sort
    if (isRatingSort) {
      transformedList.sort((a, b) => {
        // Primary sort: by calculated_rating
        const ratingDiff = (a.calculated_rating || 0) - (b.calculated_rating || 0);
        if (ratingDiff !== 0) {
          return order === 'desc' ? -ratingDiff : ratingDiff;
        }
        // Secondary sort: by review_count (more reviews = higher priority)
        const countDiff = (a.review_count || 0) - (b.review_count || 0);
        if (countDiff !== 0) {
          return order === 'desc' ? -countDiff : countDiff;
        }
        // Tertiary sort: by Id
        return order === 'desc' ? b.Id - a.Id : a.Id - b.Id;
      });

      // Apply pagination after sorting
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const paginatedList = transformedList.slice(startIndex, startIndex + parseInt(limit));
      
      res.json({ 
        success: true, 
        data: { 
          list: paginatedList, 
          pageInfo: { 
            totalRows: transformedList.length, 
            page: parseInt(page), 
            pageSize: parseInt(limit),
            isFirstPage: parseInt(page) === 1,
            isLastPage: startIndex + parseInt(limit) >= transformedList.length
          } 
        } 
      });
    } else {
      res.json({ success: true, data: { list: transformedList, pageInfo: result.pageInfo } });
    }
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

const nocodbService = require('../services/nocodb.service');
const transformService = require('../services/transform.service');

// Calculate average rating from reviews
const calculateAverageRating = (reviewsJson) => {
  try {
    const reviews = JSON.parse(reviewsJson || '[]');
    if (!Array.isArray(reviews) || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + (r.start || r.rating || 0), 0);
    return Math.round((total / reviews.length) * 10) / 10;
  } catch { return 0; }
};

// Get unique festival types for filter dropdown
const getFestivalTypes = async (req, res, next) => {
  try {
    const result = await nocodbService.getRecords('festivals', { page: 1, limit: 1000, fields: 'Id,types' });
    const allTypes = new Set();
    
    (result.list || []).forEach(festival => {
      // types field is a JSON array string like '["cultural", "traditional"]'
      try {
        const types = JSON.parse(festival.types || '[]');
        if (Array.isArray(types)) {
          types.forEach(type => {
            if (type && typeof type === 'string') {
              allTypes.add(type.trim().toLowerCase());
            }
          });
        }
      } catch {
        // If not JSON, try comma-separated
        const types = (festival.types || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        types.forEach(type => allTypes.add(type));
      }
    });

    const sortedTypes = Array.from(allTypes).sort();
    res.json({ success: true, data: sortedTypes });
  } catch (error) { next(error); }
};

// Get all festivals with pagination, sorting, and filtering
const getFestivals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sort = 'Id', order = 'asc', types = '' } = req.query;

    const conditions = [];
    if (search) conditions.push(`(name,like,%${search}%)`);
    if (types) conditions.push(`(types,like,%${types}%)`);

    const where = conditions.length > 0 ? conditions.join('~and') : '';
    const isRatingSort = sort === 'rating' || sort === 'calculated_rating';
    const fetchLimit = isRatingSort ? 1000 : parseInt(limit);
    const fetchPage = isRatingSort ? 1 : parseInt(page);
    const sortStr = isRatingSort ? 'Id' : (order === 'desc' ? `-${sort}` : sort);

    const result = await nocodbService.getRecords('festivals', {
      page: fetchPage,
      limit: fetchLimit,
      where,
      sort: sortStr,
    });

    let transformedList = (result.list || []).map(festival => ({
      ...festival,
      types_display: transformService.arrayToComma(festival.types),
      images_display: transformService.arrayToNewline(festival.images),
      videos_display: transformService.arrayToNewline(festival.videos),
      calculated_rating: calculateAverageRating(festival.reviews),
      review_count: transformService.parseJsonSafe(festival.reviews, []).length,
    }));

    if (isRatingSort) {
      transformedList.sort((a, b) => {
        const ratingDiff = (a.calculated_rating || 0) - (b.calculated_rating || 0);
        if (ratingDiff !== 0) return order === 'desc' ? -ratingDiff : ratingDiff;
        const countDiff = (a.review_count || 0) - (b.review_count || 0);
        if (countDiff !== 0) return order === 'desc' ? -countDiff : countDiff;
        return order === 'desc' ? b.Id - a.Id : a.Id - b.Id;
      });

      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const paginatedList = transformedList.slice(startIndex, startIndex + parseInt(limit));

      res.json({
        success: true,
        data: {
          list: paginatedList,
          pageInfo: { totalRows: transformedList.length, page: parseInt(page), pageSize: parseInt(limit), isFirstPage: parseInt(page) === 1, isLastPage: startIndex + parseInt(limit) >= transformedList.length }
        }
      });
    } else {
      res.json({ success: true, data: { list: transformedList, pageInfo: result.pageInfo } });
    }
  } catch (error) { next(error); }
};

// Get single festival by ID
const getFestivalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const festival = await nocodbService.getRecordById('festivals', id);
    if (!festival) return res.status(404).json({ success: false, message: 'Festival not found' });

    const transformed = {
      ...festival,
      types_display: transformService.arrayToComma(festival.types),
      images_display: transformService.arrayToNewline(festival.images),
      videos_display: transformService.arrayToNewline(festival.videos),
      calculated_rating: calculateAverageRating(festival.reviews),
    };
    res.json({ success: true, data: transformed });
  } catch (error) { next(error); }
};

// Create new festival
const createFestival = async (req, res, next) => {
  try {
    const data = req.body;
    const transformed = {
      name: data.name,
      types: transformService.commaToArray(data.types),
      description: data.description || '',
      event_time: data.event_time || '',
      location: data.location || '',
      price_level: parseInt(data.price_level) || 1,
      images: transformService.newlineToArray(data.images),
      videos: transformService.newlineToArray(data.videos),
      advise: data.advise || '',
      reviews: '[]',
    };
    const result = await nocodbService.createRecord('festivals', transformed);
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
};

// Update festival
const updateFestival = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const transformed = {
      name: data.name,
      types: transformService.commaToArray(data.types),
      description: data.description || '',
      event_time: data.event_time || '',
      location: data.location || '',
      price_level: parseInt(data.price_level) || 1,
      images: transformService.newlineToArray(data.images),
      videos: transformService.newlineToArray(data.videos),
      advise: data.advise || '',
    };
    const result = await nocodbService.updateRecord('festivals', id, transformed);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

// Delete festival
const deleteFestival = async (req, res, next) => {
  try {
    const { id } = req.params;
    await nocodbService.deleteRecord('festivals', id);
    res.json({ success: true, message: 'Festival deleted successfully' });
  } catch (error) { next(error); }
};

module.exports = { getFestivals, getFestivalById, getFestivalTypes, createFestival, updateFestival, deleteFestival };

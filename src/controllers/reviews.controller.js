const nocodbService = require('../services/nocodb.service');
const transformService = require('../services/transform.service');

// Get all reviews combined from Locations and Festivals
const getReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', locationId = '', festivalId = '' } = req.query;

    // Fetch all locations and festivals to extract reviews
    const [locationsResult, festivalsResult] = await Promise.all([
      nocodbService.getRecords('locations', { page: 1, limit: 1000, fields: 'Id,name,reviews' }),
      nocodbService.getRecords('festivals', { page: 1, limit: 1000, fields: 'Id,name,reviews' })
    ]);

    const allReviews = [];

    // Extract reviews from locations
    (locationsResult.list || []).forEach(location => {
      // Skip if filtering by specific location and this is not it
      if (locationId && location.Id.toString() !== locationId.toString()) return;
      // Skip all locations if filtering by festival
      if (festivalId) return;
      
      const reviews = transformService.parseJsonSafe(location.reviews, []);
      reviews.forEach((review, index) => {
        allReviews.push({
          id: `loc-${location.Id}-${index}`,
          source: 'Location',
          sourceId: location.Id,
          sourceName: location.name,
          user: review.name_user_review || review.user || 'Anonymous',
          rating: review.start || review.rating || 0,
          comment: review.content || review.comment || '',
          timeReview: review.time_review || '',
          reviewIndex: index,
        });
      });
    });

    // Extract reviews from festivals
    (festivalsResult.list || []).forEach(festival => {
      // Skip if filtering by specific festival and this is not it
      if (festivalId && festival.Id.toString() !== festivalId.toString()) return;
      // Skip all festivals if filtering by location
      if (locationId) return;
      
      const reviews = transformService.parseJsonSafe(festival.reviews, []);
      reviews.forEach((review, index) => {
        allReviews.push({
          id: `fest-${festival.Id}-${index}`,
          source: 'Festival',
          sourceId: festival.Id,
          sourceName: festival.name,
          user: review.name_user_review || review.user || 'Anonymous',
          rating: review.start || review.rating || 0,
          comment: review.content || review.comment || '',
          timeReview: review.time_review || '',
          reviewIndex: index,
        });
      });
    });

    // Apply search filter
    let filteredReviews = allReviews;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredReviews = filteredReviews.filter(r =>
        r.user.toLowerCase().includes(searchLower) ||
        r.sourceName.toLowerCase().includes(searchLower) ||
        r.comment.toLowerCase().includes(searchLower)
      );
    }

    // Sort by rating (highest first)
    filteredReviews.sort((a, b) => b.rating - a.rating);

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedReviews = filteredReviews.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      data: {
        list: paginatedReviews,
        pageInfo: {
          totalRows: filteredReviews.length,
          page: parseInt(page),
          pageSize: parseInt(limit),
          isFirstPage: parseInt(page) === 1,
          isLastPage: startIndex + parseInt(limit) >= filteredReviews.length
        }
      }
    });
  } catch (error) { next(error); }
};

// Get all location names for filter dropdown
const getLocationNames = async (req, res, next) => {
  try {
    const result = await nocodbService.getRecords('locations', { page: 1, limit: 1000, fields: 'Id,name' });
    const locations = (result.list || []).map(loc => ({ id: loc.Id, name: loc.name }));
    res.json({ success: true, data: locations });
  } catch (error) { next(error); }
};

// Get all festival names for filter dropdown
const getFestivalNames = async (req, res, next) => {
  try {
    const result = await nocodbService.getRecords('festivals', { page: 1, limit: 1000, fields: 'Id,name' });
    const festivals = (result.list || []).map(fest => ({ id: fest.Id, name: fest.name }));
    res.json({ success: true, data: festivals });
  } catch (error) { next(error); }
};

// Delete a specific review from a location or festival
const deleteReview = async (req, res, next) => {
  try {
    const { source, sourceId, reviewIndex } = req.params;

    const tableName = source.toLowerCase() === 'location' ? 'locations' : 'festivals';

    // Fetch the record
    const record = await nocodbService.getRecordById(tableName, sourceId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Parse reviews and remove the specified index
    const reviews = transformService.parseJsonSafe(record.reviews, []);
    const index = parseInt(reviewIndex);

    if (index < 0 || index >= reviews.length) {
      return res.status(400).json({ success: false, message: 'Invalid review index' });
    }

    reviews.splice(index, 1);

    // Update the record with new reviews array
    await nocodbService.updateRecord(tableName, sourceId, {
      reviews: JSON.stringify(reviews)
    });

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) { next(error); }
};

// Get review statistics
const getReviewStats = async (req, res, next) => {
  try {
    const [locationsResult, festivalsResult] = await Promise.all([
      nocodbService.getRecords('locations', { page: 1, limit: 1000, fields: 'reviews' }),
      nocodbService.getRecords('festivals', { page: 1, limit: 1000, fields: 'reviews' })
    ]);

    let locationReviewCount = 0;
    let festivalReviewCount = 0;
    let totalRating = 0;
    let ratingCount = 0;

    (locationsResult.list || []).forEach(loc => {
      const reviews = transformService.parseJsonSafe(loc.reviews, []);
      locationReviewCount += reviews.length;
      reviews.forEach(r => {
        totalRating += (r.start || r.rating || 0);
        ratingCount++;
      });
    });

    (festivalsResult.list || []).forEach(fest => {
      const reviews = transformService.parseJsonSafe(fest.reviews, []);
      festivalReviewCount += reviews.length;
      reviews.forEach(r => {
        totalRating += (r.start || r.rating || 0);
        ratingCount++;
      });
    });

    res.json({
      success: true,
      data: {
        totalReviews: locationReviewCount + festivalReviewCount,
        locationReviews: locationReviewCount,
        festivalReviews: festivalReviewCount,
        averageRating: ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0
      }
    });
  } catch (error) { next(error); }
};

module.exports = { getReviews, getLocationNames, getFestivalNames, deleteReview, getReviewStats };

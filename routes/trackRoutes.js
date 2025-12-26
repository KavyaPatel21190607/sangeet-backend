import express from 'express';
import Track from '../models/Track.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { validate, schemas } from '../utils/validation.js';

const router = express.Router();

/**
 * @route   GET /api/tracks
 * @desc    Get all tracks with filtering, sorting, pagination
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      genre,
      search,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = { isPublished: true };

    if (category) query.category = category;
    if (genre) query.genre = genre;
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query
    const tracks = await Track.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('uploadedBy', 'name');

    // Get total count
    const count = await Track.countDocuments(query);

    // If user is logged in, mark liked tracks
    let likedTrackIds = [];
    if (req.user) {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(req.user._id).select('likedTracks');
      likedTrackIds = user.likedTracks.map(id => id.toString());
    }

    const tracksWithLiked = tracks.map(track => {
      const trackObj = track.toJSON();
      trackObj.liked = likedTrackIds.includes(track._id.toString());
      return trackObj;
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      data: tracksWithLiked
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tracks/:id
 * @desc    Get single track
 * @access  Public
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const track = await Track.findById(req.params.id).populate('uploadedBy', 'name email');

    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found'
      });
    }

    // Check if liked by user
    let liked = false;
    if (req.user) {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(req.user._id).select('likedTracks');
      liked = user.likedTracks.some(id => id.toString() === track._id.toString());
    }

    const trackData = track.toJSON();
    trackData.liked = liked;

    res.status(200).json({
      success: true,
      track: trackData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/tracks
 * @desc    Create new track
 * @access  Private (Admin only)
 */
router.post('/', protect, authorize('admin'), validate(schemas.createTrack), async (req, res, next) => {
  try {
    const trackData = {
      ...req.body,
      uploadedBy: req.user._id
    };

    // Calculate duration in seconds
    if (trackData.duration) {
      const [minutes, seconds] = trackData.duration.split(':').map(Number);
      trackData.durationInSeconds = minutes * 60 + seconds;
    }

    const track = await Track.create(trackData);

    res.status(201).json({
      success: true,
      message: 'Track created successfully',
      track
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/tracks/:id
 * @desc    Update track
 * @access  Private (Admin only)
 */
router.put('/:id', protect, authorize('admin'), validate(schemas.updateTrack), async (req, res, next) => {
  try {
    let track = await Track.findById(req.params.id);

    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found'
      });
    }

    // Update duration in seconds if duration is changed
    if (req.body.duration) {
      const [minutes, seconds] = req.body.duration.split(':').map(Number);
      req.body.durationInSeconds = minutes * 60 + seconds;
    }

    track = await Track.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Track updated successfully',
      track
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/tracks/:id
 * @desc    Delete track
 * @access  Private (Admin only)
 */
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const track = await Track.findById(req.params.id);

    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found'
      });
    }

    await track.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Track deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tracks/trending/top
 * @desc    Get trending tracks
 * @access  Public
 */
router.get('/trending/top', optionalAuth, async (req, res, next) => {
  try {
    const { limit = 10, category } = req.query;

    const query = { isPublished: true };
    if (category) query.category = category;

    const tracks = await Track.find(query)
      .sort('-plays -likes')
      .limit(Number(limit))
      .populate('uploadedBy', 'name');

    // If user is logged in, mark liked tracks
    let likedTrackIds = [];
    if (req.user) {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(req.user._id).select('likedTracks');
      likedTrackIds = user.likedTracks.map(id => id.toString());
    }

    const tracksWithLiked = tracks.map(track => {
      const trackObj = track.toJSON();
      trackObj.liked = likedTrackIds.includes(track._id.toString());
      return trackObj;
    });

    res.status(200).json({
      success: true,
      count: tracks.length,
      data: tracksWithLiked
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tracks/recent/added
 * @desc    Get recently added tracks
 * @access  Public
 */
router.get('/recent/added', optionalAuth, async (req, res, next) => {
  try {
    const { limit = 10, category } = req.query;

    const query = { isPublished: true };
    if (category) query.category = category;

    const tracks = await Track.find(query)
      .sort('-createdAt')
      .limit(Number(limit))
      .populate('uploadedBy', 'name');

    // If user is logged in, mark liked tracks
    let likedTrackIds = [];
    if (req.user) {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(req.user._id).select('likedTracks');
      likedTrackIds = user.likedTracks.map(id => id.toString());
    }

    const tracksWithLiked = tracks.map(track => {
      const trackObj = track.toJSON();
      trackObj.liked = likedTrackIds.includes(track._id.toString());
      return trackObj;
    });

    res.status(200).json({
      success: true,
      count: tracks.length,
      data: tracksWithLiked
    });
  } catch (error) {
    next(error);
  }
});

export default router;

import express from 'express';
import Playlist from '../models/Playlist.js';
import { protect } from '../middleware/auth.js';
import { validate, schemas } from '../utils/validation.js';

const router = express.Router();

/**
 * @route   GET /api/playlists
 * @desc    Get all playlists (user's own and public)
 * @access  Private
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Get user's playlists and public playlists
    const playlists = await Playlist.find({
      $or: [
        { owner: req.user._id },
        { isPublic: true }
      ]
    })
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('owner', 'name profilePicture')
      .populate('tracks.track', 'title artist coverImage duration');

    const count = await Playlist.countDocuments({
      $or: [
        { owner: req.user._id },
        { isPublic: true }
      ]
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      data: playlists
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/playlists/my
 * @desc    Get user's own playlists
 * @access  Private
 */
router.get('/my', protect, async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id })
      .sort('-createdAt')
      .populate('tracks.track', 'title artist coverImage duration');

    res.status(200).json({
      success: true,
      count: playlists.length,
      data: playlists
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/playlists/:id
 * @desc    Get single playlist
 * @access  Private
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('owner', 'name profilePicture')
      .populate('tracks.track');

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check access
    if (!playlist.isPublic && playlist.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this playlist'
      });
    }

    res.status(200).json({
      success: true,
      playlist
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/playlists
 * @desc    Create new playlist
 * @access  Private
 */
router.post('/', protect, validate(schemas.createPlaylist), async (req, res, next) => {
  try {
    const playlistData = {
      ...req.body,
      owner: req.user._id
    };

    const playlist = await Playlist.create(playlistData);

    // Add to user's playlists
    const User = (await import('../models/User.js')).default;
    await User.findByIdAndUpdate(req.user._id, {
      $push: { playlists: playlist._id }
    });

    res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      playlist
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/playlists/:id
 * @desc    Update playlist
 * @access  Private
 */
router.put('/:id', protect, validate(schemas.updatePlaylist), async (req, res, next) => {
  try {
    let playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this playlist'
      });
    }

    playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Playlist updated successfully',
      playlist
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/playlists/:id
 * @desc    Delete playlist
 * @access  Private
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this playlist'
      });
    }

    await playlist.deleteOne();

    // Remove from user's playlists
    const User = (await import('../models/User.js')).default;
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { playlists: req.params.id }
    });

    res.status(200).json({
      success: true,
      message: 'Playlist deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/playlists/:id/tracks/:trackId
 * @desc    Add track to playlist
 * @access  Private
 */
router.post('/:id/tracks/:trackId', protect, async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this playlist'
      });
    }

    await playlist.addTrack(req.params.trackId);

    res.status(200).json({
      success: true,
      message: 'Track added to playlist',
      playlist
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/playlists/:id/tracks/:trackId
 * @desc    Remove track from playlist
 * @access  Private
 */
router.delete('/:id/tracks/:trackId', protect, async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this playlist'
      });
    }

    await playlist.removeTrack(req.params.trackId);

    res.status(200).json({
      success: true,
      message: 'Track removed from playlist',
      playlist
    });
  } catch (error) {
    next(error);
  }
});

export default router;

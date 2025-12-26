import express from 'express';
import User from '../models/User.js';
import Track from '../models/Track.js';
import { protect } from '../middleware/auth.js';
import { validate, schemas } from '../utils/validation.js';
import supabaseStorage from '../services/supabaseStorage.js';

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('likedTracks', 'title artist coverImage duration category')
      .populate({
        path: 'playlists',
        select: 'name coverImage tracks',
        populate: { path: 'tracks.track', select: 'title artist' }
      });

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, validate(schemas.updateProfile), async (req, res, next) => {
  try {
    const { name, email, profilePicture } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (profilePicture) updateData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/users/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put('/settings', protect, validate(schemas.updateSettings), async (req, res, next) => {
  try {
    const settings = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { settings },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings: user.settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/users/like-track/:trackId
 * @desc    Like a track
 * @access  Private
 */
router.post('/like-track/:trackId', protect, async (req, res, next) => {
  try {
    const { trackId } = req.params;

    // Check if track exists
    const track = await Track.findById(trackId);
    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found'
      });
    }

    const user = await User.findById(req.user._id);

    // Check if already liked
    const isLiked = user.likedTracks.includes(trackId);

    if (isLiked) {
      // Unlike
      user.likedTracks = user.likedTracks.filter(id => id.toString() !== trackId);
      await track.decrementLikes();
    } else {
      // Like
      user.likedTracks.push(trackId);
      await track.incrementLikes();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: isLiked ? 'Track unliked' : 'Track liked',
      liked: !isLiked
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/users/liked-tracks
 * @desc    Get user's liked tracks
 * @access  Private
 */
router.get('/liked-tracks', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'likedTracks',
        options: { sort: { createdAt: -1 } }
      });

    res.status(200).json({
      success: true,
      count: user.likedTracks.length,
      data: user.likedTracks
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/users/play-track/:trackId
 * @desc    Increment track play count and update user stats
 * @access  Private
 */
router.post('/play-track/:trackId', protect, async (req, res, next) => {
  try {
    const { trackId } = req.params;
    const { duration } = req.body; // Duration in seconds

    const track = await Track.findById(trackId);
    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found'
      });
    }

    // Increment track plays
    await track.incrementPlays();

    // Update user listening stats
    const user = await User.findById(req.user._id);
    user.listeningStats.totalSongsPlayed += 1;
    if (duration) {
      user.listeningStats.totalHoursListened += duration / 3600;
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Play recorded',
      plays: track.plays
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/users/upgrade-premium
 * @desc    Upgrade to premium (demo - no payment)
 * @access  Private
 */
router.put('/upgrade-premium', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    user.userType = 'premium';
    user.subscription = {
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      plan: 'monthly'
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Upgraded to premium successfully',
      user
    });
  } catch (error) {
    next(error);
  }
});

export default router;

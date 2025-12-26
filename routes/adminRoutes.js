import express from 'express';
import User from '../models/User.js';
import Track from '../models/Track.js';
import Playlist from '../models/Playlist.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authorization
router.use(protect, authorize('admin'));

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Private/Admin
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalTracks,
      totalPlaylists,
      premiumUsers,
      newUsersToday
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Track.countDocuments(),
      Playlist.countDocuments(),
      User.countDocuments({ userType: 'premium' }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);

    // Get total streams
    const streamStats = await Track.aggregate([
      {
        $group: {
          _id: null,
          totalStreams: { $sum: '$plays' }
        }
      }
    ]);

    const totalStreams = streamStats[0]?.totalStreams || 0;

    // Get songs and podcasts count
    const songCount = await Track.countDocuments({ category: 'song' });
    const podcastCount = await Track.countDocuments({ category: 'podcast' });

    // Calculate growth rates (mock data - would need historical data)
    const stats = {
      totalUsers,
      totalTracks,
      totalPodcasts: podcastCount,
      totalSongs: songCount,
      totalStreams,
      totalPlaylists,
      premiumUsers,
      newUsersToday,
      growthRate: {
        users: 12.5,
        tracks: 8.3,
        podcasts: 15.2,
        streams: 23.7
      }
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination
 * @access  Private/Admin
 */
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, userType, role } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (userType) query.userType = userType;
    if (role) query.role = role;

    const users = await User.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      data: users
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user details
 * @access  Private/Admin
 */
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('likedTracks')
      .populate('playlists');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user (admin can change role, userType, etc.)
 * @access  Private/Admin
 */
router.put('/users/:id', async (req, res, next) => {
  try {
    const { role, userType, isActive } = req.body;

    const updateData = {};
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    // Handle userType changes with subscription updates
    if (userType) {
      updateData.userType = userType;

      if (userType === 'premium') {
        // Upgrading to premium - set active subscription
        updateData.subscription = {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          plan: 'yearly'
        };
      } else if (userType === 'regular') {
        // Downgrading to regular - deactivate subscription
        updateData.subscription = {
          status: 'inactive',
          startDate: null,
          endDate: null,
          plan: 'monthly'
        };
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/tracks
 * @desc    Get all tracks (including unpublished)
 * @access  Private/Admin
 */
router.get('/tracks', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;

    const query = {};
    if (search) {
      query.$text = { $search: search };
    }
    if (category) query.category = category;

    const tracks = await Track.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('uploadedBy', 'name email');

    const count = await Track.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      data: tracks
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/activity
 * @desc    Get recent activity/logs
 * @access  Private/Admin
 */
router.get('/activity', async (req, res, next) => {
  try {
    // Get recent users
    const recentUsers = await User.find()
      .sort('-createdAt')
      .limit(5)
      .select('name email createdAt');

    // Get recent tracks
    const recentTracks = await Track.find()
      .sort('-createdAt')
      .limit(5)
      .select('title artist createdAt')
      .populate('uploadedBy', 'name');

    // Get recent playlists
    const recentPlaylists = await Playlist.find()
      .sort('-createdAt')
      .limit(5)
      .select('name owner createdAt')
      .populate('owner', 'name');

    const activity = {
      recentUsers,
      recentTracks,
      recentPlaylists
    };

    res.status(200).json({
      success: true,
      activity
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/top-content
 * @desc    Get top performing content
 * @access  Private/Admin
 */
router.get('/top-content', async (req, res, next) => {
  try {
    const topTracks = await Track.find()
      .sort('-plays -likes')
      .limit(10)
      .select('title artist plays likes category');

    res.status(200).json({
      success: true,
      topTracks
    });
  } catch (error) {
    next(error);
  }
});

export default router;

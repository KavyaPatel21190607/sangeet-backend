import express from 'express';
import spotifyService from '../services/spotifyService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/spotify/search
 * @desc    Search tracks on Spotify
 * @access  Private
 */
router.get('/search', protect, async (req, res, next) => {
  try {
    const { query, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    const tracks = await spotifyService.searchTracks(query, Number(limit));

    res.status(200).json({
      success: true,
      count: tracks.length,
      tracks
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/spotify/track/:id
 * @desc    Get track by Spotify ID
 * @access  Private
 */
router.get('/track/:id', protect, async (req, res, next) => {
  try {
    const track = await spotifyService.getTrack(req.params.id);

    res.status(200).json({
      success: true,
      track
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/spotify/tracks
 * @desc    Get multiple tracks by IDs
 * @access  Private
 */
router.post('/tracks', protect, async (req, res, next) => {
  try {
    const { trackIds } = req.body;

    if (!trackIds || !Array.isArray(trackIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of track IDs'
      });
    }

    const tracks = await spotifyService.getTracks(trackIds);

    res.status(200).json({
      success: true,
      count: tracks.length,
      tracks
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/spotify/new-releases
 * @desc    Get new releases from Spotify
 * @access  Private
 */
router.get('/new-releases', protect, async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const albums = await spotifyService.getNewReleases(Number(limit));

    res.status(200).json({
      success: true,
      count: albums.length,
      albums
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/spotify/featured-playlists
 * @desc    Get featured playlists from Spotify
 * @access  Private
 */
router.get('/featured-playlists', protect, async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const playlists = await spotifyService.getFeaturedPlaylists(Number(limit));

    res.status(200).json({
      success: true,
      count: playlists.length,
      playlists
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/spotify/recommendations
 * @desc    Get recommendations based on seed tracks
 * @access  Private
 */
router.post('/recommendations', protect, async (req, res, next) => {
  try {
    const { seedTracks, limit = 20 } = req.body;

    if (!seedTracks || !Array.isArray(seedTracks)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of seed track IDs'
      });
    }

    const tracks = await spotifyService.getRecommendations(seedTracks, Number(limit));

    res.status(200).json({
      success: true,
      count: tracks.length,
      tracks
    });
  } catch (error) {
    next(error);
  }
});

export default router;

import Joi from 'joi';

// Validation schemas
export const schemas = {
  // User registration
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required()
  }),

  // User login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Update profile
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    profilePicture: Joi.string().uri()
  }),

  // Change password
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).max(100).required()
  }),

  // Create track
  createTrack: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    artist: Joi.string().min(1).max(100).required(),
    album: Joi.string().max(100),
    duration: Joi.string().pattern(/^\d+:\d{2}$/),
    category: Joi.string().valid('song', 'podcast').required(),
    genre: Joi.string().max(50),
    coverImage: Joi.string().uri(),
    audioUrl: Joi.string().uri().required()
  }),

  // Update track
  updateTrack: Joi.object({
    title: Joi.string().min(1).max(100),
    artist: Joi.string().min(1).max(100),
    album: Joi.string().max(100),
    duration: Joi.string().pattern(/^\d+:\d{2}$/),
    category: Joi.string().valid('song', 'podcast'),
    genre: Joi.string().max(50),
    coverImage: Joi.string().uri(),
    audioUrl: Joi.string().uri(),
    isPublished: Joi.boolean()
  }),

  // Create playlist
  createPlaylist: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).allow(''),
    coverImage: Joi.string().uri().allow(''),
    isPublic: Joi.boolean()
  }),

  // Update playlist
  updatePlaylist: Joi.object({
    name: Joi.string().min(1).max(100),
    description: Joi.string().max(500),
    coverImage: Joi.string().uri(),
    isPublic: Joi.boolean()
  }),

  // Update settings
  updateSettings: Joi.object({
    crossfade: Joi.boolean(),
    gaplessPlayback: Joi.boolean(),
    normalizeVolume: Joi.boolean(),
    streamingQuality: Joi.string().valid('low', 'normal', 'high'),
    downloadQuality: Joi.string().valid('low', 'normal', 'high'),
    autoDownload: Joi.boolean(),
    wifiOnly: Joi.boolean(),
    notifications: Joi.boolean(),
    language: Joi.string()
  })
};

// Validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

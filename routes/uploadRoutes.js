import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import supabaseStorage from '../services/supabaseStorage.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Audio files
    if (file.fieldname === 'audio') {
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed for audio field'));
      }
    }
    // Image files
    else if (file.fieldname === 'image' || file.fieldname === 'coverImage') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for image field'));
      }
    }
    else {
      cb(null, true);
    }
  }
});

/**
 * @route   POST /api/upload/audio
 * @desc    Upload audio file to Supabase
 * @access  Private/Admin
 */
router.post(
  '/audio',
  protect,
  authorize('admin'),
  uploadLimiter,
  upload.single('audio'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload an audio file'
        });
      }

      const result = await supabaseStorage.uploadAudio(
        req.file.buffer,
        req.file.originalname
      );

      res.status(200).json({
        success: true,
        message: 'Audio file uploaded successfully',
        data: {
          url: result.publicUrl,
          publicUrl: result.publicUrl,
          path: result.path,
          fileName: result.fileName
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/upload/image
 * @desc    Upload image file to Supabase
 * @access  Private
 */
router.post(
  '/image',
  protect,
  uploadLimiter,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload an image file'
        });
      }

      const result = await supabaseStorage.uploadImage(
        req.file.buffer,
        req.file.originalname
      );

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: result.publicUrl,
          publicUrl: result.publicUrl,
          path: result.path,
          fileName: result.fileName
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/upload/track
 * @desc    Upload complete track (audio + cover image)
 * @access  Private/Admin
 */
router.post(
  '/track',
  protect,
  authorize('admin'),
  uploadLimiter,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const { audio, coverImage } = req.files;

      if (!audio || !audio[0]) {
        return res.status(400).json({
          success: false,
          message: 'Please upload an audio file'
        });
      }

      // Upload audio
      const audioResult = await supabaseStorage.uploadAudio(
        audio[0].buffer,
        audio[0].originalname
      );

      let imageResult = null;
      // Upload cover image if provided
      if (coverImage && coverImage[0]) {
        imageResult = await supabaseStorage.uploadImage(
          coverImage[0].buffer,
          coverImage[0].originalname
        );
      }

      res.status(200).json({
        success: true,
        message: 'Track files uploaded successfully',
        audio: {
          url: audioResult.publicUrl,
          path: audioResult.path
        },
        coverImage: imageResult ? {
          url: imageResult.publicUrl,
          path: imageResult.path
        } : null
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/upload/file
 * @desc    Delete file from Supabase
 * @access  Private/Admin
 */
router.delete('/file', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'Please provide file path'
      });
    }

    await supabaseStorage.deleteFile(filePath);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

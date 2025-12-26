import supabase from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || 'sangeet-media';

class SupabaseStorageService {
  /**
   * Upload file to Supabase Storage
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original file name
   * @param {string} folder - Folder path (e.g., 'audio', 'images')
   * @param {string} contentType - MIME type
   * @returns {Promise<object>} - Upload result with public URL
   */
  async uploadFile(fileBuffer, fileName, folder = 'uploads', contentType) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }

      // Generate unique filename
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${folder}/${uuidv4()}.${fileExtension}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(uniqueFileName, fileBuffer, {
          contentType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uniqueFileName);

      return {
        success: true,
        path: data.path,
        publicUrl,
        fileName: uniqueFileName
      };
    } catch (error) {
      console.error('Upload service error:', error);
      throw error;
    }
  }

  /**
   * Delete file from Supabase Storage
   * @param {string} filePath - File path in storage
   * @returns {Promise<object>} - Delete result
   */
  async deleteFile(filePath) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }

      return {
        success: true,
        message: 'File deleted successfully',
        data
      };
    } catch (error) {
      console.error('Delete service error:', error);
      throw error;
    }
  }

  /**
   * Upload audio file
   * @param {Buffer} fileBuffer - Audio file buffer
   * @param {string} fileName - Original file name
   * @returns {Promise<object>} - Upload result
   */
  async uploadAudio(fileBuffer, fileName) {
    return this.uploadFile(fileBuffer, fileName, 'audio', 'audio/mpeg');
  }

  /**
   * Upload image file
   * @param {Buffer} fileBuffer - Image file buffer
   * @param {string} fileName - Original file name
   * @returns {Promise<object>} - Upload result
   */
  async uploadImage(fileBuffer, fileName) {
    const contentType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return this.uploadFile(fileBuffer, fileName, 'images', contentType);
  }

  /**
   * Get signed URL for private files
   * @param {string} filePath - File path in storage
   * @param {number} expiresIn - URL expiration in seconds
   * @returns {Promise<string>} - Signed URL
   */
  async getSignedUrl(filePath, expiresIn = 3600) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Failed to get signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL error:', error);
      throw error;
    }
  }
}

export default new SupabaseStorageService();

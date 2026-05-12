const cloudinary = require('cloudinary').v2;

/**
 * Cloudinary Storage Implementation
 * Handles image uploads to Cloudinary (with CDN + auto-optimization)
 */
class CloudinaryStorage {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    this.folder = process.env.CLOUDINARY_FOLDER || 'cricket-auction/players';

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('⚠️  Cloudinary env vars missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in backend/.env');
    }
  }

  /**
   * Upload player image to Cloudinary
   * Returns an optimized, CDN-served URL with auto format + quality.
   */
  uploadPlayerImage(fileBuffer, playerId, mimetype) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          public_id: String(playerId),
          overwrite: true,
          resource_type: 'image',
          // Auto format (webp/avif when supported), auto quality, square crop for cards
          transformation: [
            { width: 600, height: 600, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(new Error(`Failed to upload image: ${error.message}`));
          }
          console.log('Image uploaded to Cloudinary:', result.secure_url);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Delete player image from Cloudinary
   */
  async deletePlayerImage(playerId) {
    try {
      const publicId = `${this.folder}/${playerId}`;
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      const ok = result.result === 'ok' || result.result === 'not found';
      if (ok) console.log(`Deleted Cloudinary image: ${publicId}`);
      return ok;
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      return false;
    }
  }

  /**
   * Get image URL for a player (constructs the canonical delivery URL)
   */
  async getPlayerImageUrl(playerId) {
    try {
      const publicId = `${this.folder}/${playerId}`;
      // Verify it exists
      await cloudinary.api.resource(publicId, { resource_type: 'image' });
      return cloudinary.url(publicId, {
        secure: true,
        transformation: [
          { width: 600, height: 600, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if Cloudinary is configured and reachable
   */
  async isAvailable() {
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME) return false;
      await cloudinary.api.ping();
      return true;
    } catch (error) {
      console.error('Cloudinary not available:', error.message);
      return false;
    }
  }
}

module.exports = CloudinaryStorage;

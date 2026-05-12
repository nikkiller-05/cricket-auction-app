/**
 * Image Storage Service
 * Abstraction layer for handling player image uploads
 * Can switch between different storage backends (Supabase, local, AWS S3, etc.)
 */

class ImageStorageService {
  constructor(implementation) {
    this.storage = implementation;
    console.log(`Image Storage initialized with: ${implementation.constructor.name}`);
  }

  /**
   * Upload a player image
   * @param {Buffer} fileBuffer - Image file buffer
   * @param {string} playerId - Unique player ID
   * @param {string} mimetype - File mimetype (image/jpeg, image/png, etc.)
   * @returns {Promise<string>} - Public URL of uploaded image
   */
  async uploadPlayerImage(fileBuffer, playerId, mimetype) {
    return await this.storage.uploadPlayerImage(fileBuffer, playerId, mimetype);
  }

  /**
   * Delete a player image
   * @param {string} playerId - Unique player ID
   * @returns {Promise<boolean>} - Success status
   */
  async deletePlayerImage(playerId) {
    return await this.storage.deletePlayerImage(playerId);
  }

  /**
   * Get image URL for a player
   * @param {string} playerId - Unique player ID
   * @returns {Promise<string|null>} - Image URL or null
   */
  async getPlayerImageUrl(playerId) {
    return await this.storage.getPlayerImageUrl(playerId);
  }

  /**
   * Check if storage is available
   * @returns {Promise<boolean>} - Availability status
   */
  async isAvailable() {
    return await this.storage.isAvailable();
  }
}

module.exports = ImageStorageService;

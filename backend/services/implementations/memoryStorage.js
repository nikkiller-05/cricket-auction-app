/**
 * Memory/Local Storage Implementation
 * Stores image URLs in memory (for development/fallback)
 * NOTE: Images are not actually stored, only URLs are tracked
 */
class MemoryStorage {
  constructor() {
    this.imageUrls = new Map(); // playerId -> imageUrl
    console.log('Memory Storage initialized (in-memory image URL tracking)');
  }

  /**
   * "Upload" player image (just stores URL reference)
   * In real scenario, this would save to local filesystem
   */
  async uploadPlayerImage(fileBuffer, playerId, mimetype) {
    try {
      // Simulate upload - in production this could save to local filesystem
      const fakeUrl = `/images/players/${playerId}.jpg`;
      this.imageUrls.set(playerId, fakeUrl);
      
      console.log(`Memory storage: Stored URL for player ${playerId}`);
      return fakeUrl;

    } catch (error) {
      console.error('Error in memory storage:', error);
      throw error;
    }
  }

  /**
   * Delete player image from memory
   */
  async deletePlayerImage(playerId) {
    try {
      const existed = this.imageUrls.has(playerId);
      this.imageUrls.delete(playerId);
      console.log(`Memory storage: Deleted URL for player ${playerId}`);
      return existed;
    } catch (error) {
      console.error('Error deleting from memory:', error);
      return false;
    }
  }

  /**
   * Get image URL for a player
   */
  async getPlayerImageUrl(playerId) {
    return this.imageUrls.get(playerId) || null;
  }

  /**
   * Check availability (always available)
   */
  async isAvailable() {
    return true;
  }

  /**
   * Clear all stored URLs (for testing/reset)
   */
  clear() {
    this.imageUrls.clear();
    console.log('Memory storage: Cleared all image URLs');
  }
}

module.exports = MemoryStorage;

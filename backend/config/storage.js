const ImageStorageService = require('../services/imageStorageService');
const MemoryStorage = require('../services/implementations/memoryStorage');
const CloudinaryStorage = require('../services/implementations/cloudinaryStorage');

/**
 * Storage Configuration
 * Switches between storage implementations based on DATABASE_TYPE env variable
 * Supported: 'cloudinary' | 'supabase' | 'memory'
 */

const storageType = process.env.DATABASE_TYPE || 'memory';
let storageImplementation;

switch (storageType) {
  case 'cloudinary':
    console.log('☁️  Using Cloudinary Storage for images');
    storageImplementation = new CloudinaryStorage();
    break;

  case 'supabase': {
    // Lazy-required so the app does not need Supabase deps when unused.
    console.log('📦 Using Supabase Storage for images');
    // eslint-disable-next-line global-require
    const SupabaseStorage = require('../services/implementations/supabaseStorage');
    storageImplementation = new SupabaseStorage();
    break;
  }

  case 'memory':
  default:
    console.log('💾 Using Memory Storage for images (development mode)');
    storageImplementation = new MemoryStorage();
    break;
}

// Create and export the image storage service
const imageStorage = new ImageStorageService(storageImplementation);

module.exports = imageStorage;

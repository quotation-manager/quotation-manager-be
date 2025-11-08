const sharp = require('sharp');
const { IMAGE_CONFIG } = require('../utils/constants');

/**
 * Image Compression Service
 * Compresses images before uploading to S3 to reduce storage and bandwidth usage
 */

/**
 * Compress image buffer with configurable quality and dimensions
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} options - Compression options
 * @param {number} options.quality - JPEG quality (1-100), default: 80
 * @param {number} options.maxWidth - Maximum width in pixels, default: 1920
 * @param {number} options.maxHeight - Maximum height in pixels, default: 1080
 * @param {string} options.format - Output format ('jpeg', 'png', 'webp'), default: 'jpeg'
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
const compressImage = async (imageBuffer, options = {}) => {
  try {
    const { quality = 80, maxWidth = 1920, maxHeight = 1080, format = 'jpeg' } = options;

    // Validate quality
    if (quality < 1 || quality > 100) {
      throw new Error('Quality must be between 1 and 100');
    }

    // Validate format
    const validFormats = ['jpeg', 'png', 'webp'];
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();

    // Calculate new dimensions while maintaining aspect ratio
    let { width, height } = metadata;

    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;

      if (width > height) {
        // Landscape image
        width = maxWidth;
        height = Math.round(maxWidth / aspectRatio);

        // If height is still too large, scale down proportionally
        if (height > maxHeight) {
          height = maxHeight;
          width = Math.round(maxHeight * aspectRatio);
        }
      } else {
        // Portrait or square image
        height = maxHeight;
        width = Math.round(maxHeight * aspectRatio);

        // If width is still too large, scale down proportionally
        if (width > maxWidth) {
          width = maxWidth;
          height = Math.round(maxWidth / aspectRatio);
        }
      }
    }

    // Compress and resize image with orientation preservation
    let sharpInstance = sharp(imageBuffer, {
      failOnError: false, // Don't fail on corrupt images
    })
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    // Apply format-specific compression
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality });
        break;
    }

    const compressedBuffer = await sharpInstance.toBuffer();

    return compressedBuffer;
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error(`Failed to compress image: ${error.message}`);
  }
};

/**
 * Compress image with default settings optimized for quotation items
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
const compressQuotationImage = async imageBuffer => {
  // Check if compression is enabled and image is large enough to compress
  if (
    !IMAGE_CONFIG.COMPRESSION.ENABLED ||
    imageBuffer.length < IMAGE_CONFIG.COMPRESSION.MIN_SIZE_TO_COMPRESS
  ) {
    return imageBuffer; // Return original if compression is disabled or image is too small
  }

  // If preserve dimensions is enabled, only compress quality, not resize
  if (IMAGE_CONFIG.COMPRESSION.PRESERVE_DIMENSIONS) {
    return compressImageQualityOnly(imageBuffer, {
      quality: IMAGE_CONFIG.COMPRESSION.QUALITY,
      format: IMAGE_CONFIG.COMPRESSION.OUTPUT_FORMAT,
    });
  }

  // Fallback to original compression with dimension limits
  return compressImage(imageBuffer, {
    quality: IMAGE_CONFIG.COMPRESSION.QUALITY,
    maxWidth: 1200, // Default fallback
    maxHeight: 1200, // Default fallback
    format: IMAGE_CONFIG.COMPRESSION.OUTPUT_FORMAT,
  });
};

/**
 * Compress image quality only (preserves original dimensions)
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} options - Compression options
 * @param {number} options.quality - JPEG quality (1-100)
 * @param {string} options.format - Output format ('jpeg', 'png', 'webp')
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
const compressImageQualityOnly = async (imageBuffer, options = {}) => {
  try {
    const { quality = 75, format = 'jpeg' } = options;

    // Validate quality
    if (quality < 1 || quality > 100) {
      throw new Error('Quality must be between 1 and 100');
    }

    // Validate format
    const validFormats = ['jpeg', 'png', 'webp'];
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }

    // Get image metadata to preserve original dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    // Compress image with original dimensions and orientation preservation
    let sharpInstance = sharp(imageBuffer, {
      failOnError: false, // Don't fail on corrupt images
    }).rotate(); // Auto-rotate based on EXIF orientation

    // Apply format-specific compression
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality });
        break;
    }

    const compressedBuffer = await sharpInstance.toBuffer();

    return compressedBuffer;
  } catch (error) {
    console.error('Image quality compression error:', error);
    throw new Error(`Failed to compress image quality: ${error.message}`);
  }
};

/**
 * Compress image with high quality settings for important images
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
const compressHighQualityImage = async imageBuffer => {
  return compressImage(imageBuffer, {
    quality: 90, // High quality
    maxWidth: 1920, // Full HD
    maxHeight: 1080,
    format: 'jpeg',
  });
};

/**
 * Compress image with aggressive settings for maximum file size reduction
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
const compressAggressiveImage = async imageBuffer => {
  return compressImage(imageBuffer, {
    quality: 60, // Lower quality for maximum compression
    maxWidth: 800, // Smaller dimensions
    maxHeight: 800,
    format: 'jpeg',
  });
};

/**
 * Get image metadata without processing
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} - Image metadata
 */
const getImageMetadata = async imageBuffer => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: imageBuffer.length,
      hasAlpha: metadata.hasAlpha,
    };
  } catch (error) {
    console.error('Error getting image metadata:', error);
    throw new Error(`Failed to get image metadata: ${error.message}`);
  }
};

/**
 * Validate if image can be compressed
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<boolean>} - Whether image can be compressed
 */
const canCompressImage = async imageBuffer => {
  try {
    const metadata = await getImageMetadata(imageBuffer);
    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];

    return supportedFormats.includes(metadata.format);
  } catch (error) {
    return false;
  }
};

module.exports = {
  compressImage,
  compressImageQualityOnly,
  compressQuotationImage,
  compressHighQualityImage,
  compressAggressiveImage,
  getImageMetadata,
  canCompressImage,
};

const cloudinary = require('../config/cloudinary');

/**
 * Uploads a file buffer to Cloudinary with compression, sizing limits, and automatic thumbnail generation.
 * @param {Buffer} fileBuffer Buffer content of the file.
 * @param {Object} options Configuration parameters.
 * @param {string} options.folder Cloudinary storage directory path.
 * @param {number} options.maxWidth Capped width limit for master asset.
 * @param {string} options.quality Compression level quality parameter.
 * @param {boolean} options.generateThumbnail Flag to generate thumbnail URL.
 * @param {number} options.thumbnailSize Dimensions for square thumbnail.
 * @param {boolean} options.isStudentPhoto If true, applies face-detection centered cropping (g_face).
 * @returns {Promise<{url: string, thumbnailUrl: string|null, publicId: string}>}
 */
const uploadAndOptimize = (fileBuffer, options = {}) => {
  const {
    folder = 'br-school',
    maxWidth = 1920,
    quality = 'auto:good',
    generateThumbnail = true,
    thumbnailSize = 150,
    isStudentPhoto = true
  } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: maxWidth, crop: 'limit', quality, fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        let thumbnailUrl = null;
        if (generateThumbnail && result.secure_url) {
          const parts = result.secure_url.split('/upload/');
          if (parts.length === 2) {
            const faceGravity = isStudentPhoto ? ',g_face' : '';
            const transform = `w_${thumbnailSize},h_${thumbnailSize},c_fill${faceGravity},q_auto:eco,f_auto`;
            thumbnailUrl = `${parts[0]}/upload/${transform}/${parts[1]}`;
          } else {
            thumbnailUrl = result.secure_url;
          }
        }

        resolve({
          url: result.secure_url,
          thumbnailUrl: thumbnailUrl,
          publicId: result.public_id
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = { uploadAndOptimize };

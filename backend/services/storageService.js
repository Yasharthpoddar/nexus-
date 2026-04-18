const supabase = require('../db/config');

/**
 * Uploads a file to Supabase Storage.
 * @param {string} bucket - The name of the storage bucket ('nexus-documents' or 'nexus-certificates').
 * @param {string} filePath - The path/filename to save the file as.
 * @param {Buffer} fileBuffer - The file data buffer.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Promise<string>} - The permanent public or internal URL reference (or just the path).
 */
async function uploadToStorage(bucket, filePath, fileBuffer, mimeType) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload to storage: ${error.message}`);
  }

  // Return the path or URL. We'll return the path since getSignedUrl needs the path.
  return data.path;
}

/**
 * Generates a signed URL for temporary access to a private file.
 * @param {string} bucket - The name of the storage bucket.
 * @param {string} filePath - The path to the file in the bucket.
 * @param {number} expiresInSeconds - Time until URL expires (default 3600 = 1 hour).
 * @returns {Promise<string>} - The signed URL.
 */
async function getSignedUrl(bucket, filePath, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Deletes a file from Supabase Storage.
 * @param {string} bucket - The name of the storage bucket.
 * @param {string} filePath - The path to the file.
 * @returns {Promise<boolean>} - True if successful.
 */
async function deleteFromStorage(bucket, filePath) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete from storage: ${error.message}`);
  }

  return true;
}

module.exports = {
  uploadToStorage,
  getSignedUrl,
  deleteFromStorage
};

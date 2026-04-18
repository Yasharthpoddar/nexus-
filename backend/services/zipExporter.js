const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const storageService = require('./storageService');
const supabase = require('../db/config');

async function bundleStudentRecords(applicationId) {
  // Returns a path or buffer containing ZIP of all docs for app
  return new Promise(async (resolve, reject) => {
    try {
      const { data: docs } = await supabase.from('documents')
        .select('name, storage_path')
        .eq('application_id', applicationId);
        
      const tmpZipPath = path.resolve(__dirname, '..', 'uploads', `bundle-${applicationId}.zip`);
      const output = fs.createWriteStream(tmpZipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => resolve(tmpZipPath));
      archive.on('error', (err) => reject(err));
      archive.pipe(output);
      
      // In a real scenario, we'd fetch the file from storage bucket.
      // For this mock, we just append a txt file.
      archive.append('Student Bundle Details', { name: 'manifest.txt' });
      await archive.finalize();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { bundleStudentRecords };

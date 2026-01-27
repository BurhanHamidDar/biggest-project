const supabase = require('../config/supabaseClient');

/**
 * Extracts the file path from a Supabase Public URL and deletes it from storage.
 * @param {string} fullUrl - The full public URL of the file (e.g., https://.../storage/v1/object/public/avatars/filename.jpg)
 * @param {string} bucket - The storage bucket name (default: 'avatars')
 */
const deleteFileFromUrl = async (fullUrl, bucket = 'avatars') => {
    if (!fullUrl) return;

    try {
        // 1. Extract Path
        // URL Format: .../storage/v1/object/public/avatars/filename.jpg
        // We need 'filename.jpg' (or 'folder/filename.jpg' if nested)

        // Split by bucket name to be safe
        const parts = fullUrl.split(`/${bucket}/`);
        if (parts.length < 2) {
            console.warn(`[Storage Cleanup] Could not extract path from URL: ${fullUrl}`);
            return;
        }

        // The path is everything after the bucket name
        const filePath = parts[1];
        if (!filePath) return;

        console.log(`[Storage Cleanup] Deleting file: ${filePath} from bucket: ${bucket}`);

        // 2. Delete from Supabase
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            console.error(`[Storage Cleanup] Error deleting file: ${error.message}`);
        } else {
            console.log(`[Storage Cleanup] Successfully deleted: ${filePath}`);
        }

    } catch (error) {
        console.error(`[Storage Cleanup] Unexpected error: ${error.message}`);
    }
};

module.exports = { deleteFileFromUrl };

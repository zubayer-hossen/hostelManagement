import { config } from '../../config/env.js';
import { localStorageProvider } from './local.js';
import { cloudinaryStorageProvider } from './cloudinary.js';

/**
 * Storage abstraction: every provider implements
 *   save(buffer, { filename, mime, baseUrl }) -> { url, key }
 *   remove(key)
 * Add S3 / Supabase / etc. by writing another provider and registering it here.
 */
const PROVIDERS = { local: localStorageProvider, cloudinary: cloudinaryStorageProvider };
export const getStorage = () => PROVIDERS[config.STORAGE_PROVIDER];

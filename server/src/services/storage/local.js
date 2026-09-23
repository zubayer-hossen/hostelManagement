import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const UPLOAD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../uploads');

export const localStorageProvider = {
  name: 'local',
  /** Saves the buffer and returns { url, key }. `baseUrl` is the public origin of this API. */
  async save(buffer, { filename, baseUrl }) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer, { flag: 'wx' });
    return { url: `${baseUrl}/uploads/${filename}`, key: filename };
  },
  async remove(key) {
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(key))).catch(() => {});
  },
};

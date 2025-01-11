import fs from "fs-extra";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import config from "../config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const addDomain = (filePath) => {
  if (!filePath) return null;
  return `${config.DOMAIN}/${filePath}`;
};

export const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.ensureDir(dirPath);
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
};

export const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;

  const imagePath = fileUrl.replace(config.DOMAIN, "");
  const fullPath = path.join(__dirname, "..", "..", imagePath);

  try {
    const exists = await fs.pathExists(fullPath);
    if (!exists) {
      console.warn(`File not found: ${fullPath}`);
      return;
    }
    await fs.unlink(fullPath);
  } catch (error) {
    console.error("Failed to delete file:", error);
  }
};

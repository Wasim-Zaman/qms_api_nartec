import fs from "fs-extra";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import config from "../config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.join(__dirname, "../../");

export const addDomain = (filePath) => {
  if (!filePath) return null;
  return `${config.DOMAIN}/${filePath}`;
};

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<string>} - Returns the absolute path
 */
export const ensureDir = async (dirPath) => {
  const absolutePath = path.isAbsolute(dirPath)
    ? dirPath
    : path.join(ROOT_DIR, dirPath);

  await fs.ensureDir(absolutePath);
  return absolutePath;
};

/**
 * Creates a relative path from the root directory
 * @param {string} filePath - Path to convert
 * @returns {string} - Relative path from root
 */
export const getRelativePath = (filePath) => {
  return path.relative(ROOT_DIR, filePath);
};

/**
 * Ensures required directories exist for file operations
 * @returns {Promise<void>}
 */
export const ensureRequiredDirs = async () => {
  await Promise.all([
    ensureDir("uploads"),
    ensureDir("uploads/tickets"),
    // Add more directories as needed
  ]);
};

/**
 * Deletes a file if it exists
 * @param {string} filePath - Path to the file
 * @returns {Promise<void>}
 */
export const deleteFile = async (filePath) => {
  if (!filePath) return;

  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(ROOT_DIR, filePath);

  try {
    await fs.remove(absolutePath);
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
};

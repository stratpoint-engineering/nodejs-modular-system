/**
 * Core utilities for the modular system
 *
 * This module provides common utility functions used across the system.
 */

/**
 * Safely access a nested property in an object using a path string
 *
 * @param {object} obj - The object to access
 * @param {string} path - The path to the property (e.g., 'user.profile.name')
 * @param {any} defaultValue - The default value to return if the path doesn't exist
 * @returns {any} The value at the path or the default value
 */
export function get(obj, path, defaultValue) {
  if (!obj || !path) {
    return defaultValue;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === undefined || current === null || typeof current !== 'object') {
      return defaultValue;
    }

    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Set a nested property in an object using a path string
 *
 * @param {object} obj - The object to modify
 * @param {string} path - The path to the property (e.g., 'user.profile.name')
 * @param {any} value - The value to set
 * @returns {object} The modified object
 */
export function set(obj, path, value) {
  if (!obj || !path) {
    return obj;
  }

  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
      current[key] = {};
    }

    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return obj;
}

/**
 * Deep merge multiple objects
 *
 * @param {...object} objects - Objects to merge
 * @returns {object} Merged object
 */
export function merge(...objects) {
  const result = {};

  for (const obj of objects) {
    if (!obj) continue;

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          result[key] = merge(result[key] || {}, obj[key]);
        } else {
          result[key] = obj[key];
        }
      }
    }
  }

  return result;
}

/**
 * Generate a random ID
 *
 * @param {number} length - The length of the ID
 * @returns {string} Random ID
 */
export function generateId(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Safely parse JSON with a fallback value
 *
 * @param {string} str - The JSON string to parse
 * @param {any} fallback - The fallback value if parsing fails
 * @returns {any} The parsed object or the fallback value
 */
export function parseJSON(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return fallback;
  }
}

/**
 * Format a date using a simple template
 *
 * @param {Date|string|number} date - The date to format
 * @param {string} format - The format template (e.g., 'YYYY-MM-DD')
 * @returns {string} The formatted date
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

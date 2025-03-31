/**
 * Type definitions for utility functions
 */

/**
 * Safely access a nested property in an object using a path string
 */
export function get<T>(obj: any, path: string, defaultValue?: T): T;

/**
 * Set a nested property in an object using a path string
 */
export function set<T extends object>(obj: T, path: string, value: any): T;

/**
 * Deep merge multiple objects
 */
export function merge<T>(...objects: any[]): T;

/**
 * Generate a random ID
 */
export function generateId(length?: number): string;

/**
 * Safely parse JSON with a fallback value
 */
export function parseJSON<T>(str: string, fallback?: T): T;

/**
 * Format a date using a simple template
 */
export function formatDate(date: Date | string | number, format?: string): string;

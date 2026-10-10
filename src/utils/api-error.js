import { AppError } from './app-error.js';

/**
 * Create an operational API error with an HTTP status.
 * @param {number} statusCode HTTP status code.
 * @param {string} message Safe client-facing message.
 * @param {object} [details] Optional validation or diagnostic details.
 * @returns {AppError}
 */
export function apiError(statusCode, message, details) {
  return new AppError(statusCode, 'REQUEST_ERROR', message, details);
}

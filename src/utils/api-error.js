/**
 * Create an operational API error with an HTTP status.
 * @param {number} statusCode HTTP status code.
 * @param {string} message Safe client-facing message.
 * @param {object} [details] Optional validation or diagnostic details.
 * @returns {Error & {statusCode: number, details?: object}}
 */
export function apiError(statusCode, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

/**
 * Operational error that can safely cross the HTTP boundary.
 */
export class AppError extends Error {
  /**
   * @param {number} status HTTP status.
   * @param {string} code Stable machine-readable error code.
   * @param {string} message Safe client-facing message.
   * @param {unknown} [details] Optional safe details.
   */
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

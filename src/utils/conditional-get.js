import crypto from 'node:crypto';

/**
 * Find the newest usable timestamp in a response body.
 * Updated timestamps are preferred for resources; recorded timestamps are used
 * for location events and arrays of live/history records.
 * @param {unknown} value JSON response value.
 * @returns {Date|null} Latest response timestamp.
 */
function findLastModified(value) {
  const dates = [];
  const visit = (item) => {
    if (Array.isArray(item)) return item.forEach(visit);
    if (!item || typeof item !== 'object') return;
    for (const key of ['updatedAt', 'recordedAt']) {
      if (item[key]) dates.push(new Date(item[key]));
    }
    if (item.data) visit(item.data);
  };
  visit(value);
  const validDates = dates.filter((date) => !Number.isNaN(date.getTime()));
  return validDates.length ? new Date(Math.max(...validDates.map((date) => date.getTime()))) : null;
}

/**
 * Send a JSON response with ETag and Last-Modified conditional caching.
 * The private revalidation policy is appropriate for authenticated responses:
 * clients may cache bytes, but must revalidate before using stale data.
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {unknown} body JSON response body.
 * @param {object} [options] Cache options.
 * @param {Date|string} [options.lastModified] Explicit latest resource timestamp.
 * @param {string} [options.cacheControl] Cache-Control value.
 * @returns {void}
 */
export function sendConditionalJson(req, res, body, options = {}) {
  const serialized = JSON.stringify(body);
  const etag = `"${crypto.createHash('sha256').update(serialized).digest('hex')}"`;
  const lastModified = options.lastModified ? new Date(options.lastModified) : findLastModified(body);
  const cacheControl = options.cacheControl || 'private, max-age=0, must-revalidate';
  res.set({ ETag: etag, 'Cache-Control': cacheControl });
  if (lastModified && !Number.isNaN(lastModified.getTime())) {
    const httpDate = lastModified.toUTCString();
    res.set('Last-Modified', httpDate);
    const ifNoneMatch = req.get('If-None-Match');
    const ifModifiedSince = req.get('If-Modified-Since');
    const matchesEtag = ifNoneMatch === '*' || ifNoneMatch?.split(',').map((value) => value.trim()).includes(etag);
    const isFresh = ifModifiedSince && new Date(ifModifiedSince).getTime() >= lastModified.getTime();
    if (matchesEtag || isFresh) return res.status(304).end();
  } else if (req.get('If-None-Match') === etag) {
    return res.status(304).end();
  }
  res.type('application/json').send(serialized);
}

import AuditLog from '../models/audit-log.model.js';

/**
 * Record a history endpoint access for operational accountability.
 * @param {import('express').Request} req Express request.
 * @returns {Promise<object>} Created audit record.
 */
export function recordHistoryAccess(req) {
  const actorUserId = req.user?.sub && /^[a-f\d]{24}$/i.test(String(req.user.sub)) ? req.user.sub : undefined;
  return AuditLog.create({
    actorUserId,
    actorUsername: req.user?.username || 'unknown',
    action: 'HISTORY_ACCESS',
    resourceType: 'LocationPing',
    metadata: { endpoint: req.originalUrl, query: req.query },
    ipAddress: req.ip,
    occurredAt: new Date()
  });
}

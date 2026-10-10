import mongoose from 'mongoose';

/** Audit entries provide an immutable trail for security-sensitive operations. */
const auditLogSchema = new mongoose.Schema({
  actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true, trim: true },
  resourceType: { type: String, required: true, trim: true },
  resourceId: mongoose.Schema.Types.ObjectId,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: String,
  occurredAt: { type: Date, default: Date.now, immutable: true }
}, { timestamps: true });

auditLogSchema.index({ resourceType: 1, resourceId: 1, occurredAt: -1 });
auditLogSchema.index({ actorUserId: 1, occurredAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);

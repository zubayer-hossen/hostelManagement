import { AuditLog } from '../models/AuditLog.js';
import { getClientIp } from '../utils/requestMeta.js';

/**
 * Records an important action. Never throws: a failing audit write must not break the request,
 * but the failure is logged loudly.
 */
export async function logAudit({ req, actor, action, entity, entityId, metadata }) {
  try {
    const actingUser = actor ?? req?.user ?? null;
    await AuditLog.create({
      actor: actingUser?._id ?? null,
      actorRole: actingUser?.role,
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      ip: req ? getClientIp(req) : undefined,
      metadata,
    });
  } catch (err) {
    console.error('[audit] failed to write audit log:', err.message);
  }
}

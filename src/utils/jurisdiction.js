/**
 * Build a MongoDB filter for the authenticated user's jurisdiction.
 * @param {{role?: string, scope?: {provinceId?: string, districtId?: string, stationId?: string}}} user JWT user claims.
 * @returns {object} MongoDB filter additions.
 */
export function jurisdictionFilter(user = {}) {
  if (!user.scope) return {};
  if (user.role === 'HQ_ADMIN') return {};
  if (user.role === 'PROVINCIAL_OFFICER' && user.scope.provinceId) return { provinceId: user.scope.provinceId };
  if ((user.role === 'STATION_OFFICER' || user.role === 'DEVICE') && user.scope.stationId) return { stationId: user.scope.stationId };
  if (user.role === 'STATION_OFFICER' && user.scope.districtId) return { districtId: user.scope.districtId };
  if (user.role === 'PROVINCIAL_OFFICER' || user.role === 'STATION_OFFICER' || user.role === 'DEVICE') return { _id: null };
  return {};
}

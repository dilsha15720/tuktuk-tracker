/**
 * Build a MongoDB filter for the authenticated user's jurisdiction.
 * @param {{role?: string, scope?: {province?: string, district?: string, policeStation?: string}}} user JWT user claims.
 * @returns {object} MongoDB filter additions.
 */
export function jurisdictionFilter(user = {}) {
  if (!user.scope) return {};
  if (user.role === 'PROVINCIAL_OFFICER' && user.scope.province) return { province: user.scope.province };
  if (user.role === 'STATION_OFFICER' && user.scope.policeStation) return { policeStation: user.scope.policeStation };
  if (user.role === 'DEVICE' && user.scope.policeStation) return { policeStation: user.scope.policeStation };
  return {};
}

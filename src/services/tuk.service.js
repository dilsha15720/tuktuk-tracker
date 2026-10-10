import Tuk from '../models/tuk.model.js';

/**
 * Calculate operational Tuk totals for a safe MongoDB filter.
 * @param {object} filter Validated jurisdiction filter.
 * @returns {Promise<{total: number, byStatus: Array<{status: string, count: number}>>} Statistics.
 */
export async function getTukStatistics(filter = {}) {
  const [total, byStatus] = await Promise.all([
    Tuk.countDocuments(filter),
    Tuk.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
  ]);
  return { total, byStatus: byStatus.map(({ _id, count }) => ({ status: _id, count })) };
}

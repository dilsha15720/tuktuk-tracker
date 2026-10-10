import LocationPing from '../models/location-ping.model.js';
import Vehicle from '../models/vehicle.model.js';
import VehicleLastLocation from '../models/vehicle-last-location.model.js';
import { apiError } from '../utils/api-error.js';

/**
 * Convert a validated ping into the canonical GeoJSON persistence shape.
 * @param {object} ping Validated latitude/longitude ping.
 * @param {object} device Authenticated device document.
 * @param {object} vehicle Registered vehicle document.
 * @returns {object} LocationPing document input.
 */
function toPingDocument(ping, device, vehicle) {
  return {
    vehicleId: vehicle._id,
    deviceId: device._id,
    provinceId: vehicle.provinceId,
    districtId: vehicle.districtId,
    stationId: vehicle.stationId,
    location: { type: 'Point', coordinates: [ping.longitude, ping.latitude] },
    speed: ping.speed,
    heading: ping.heading,
    recordedAt: ping.recordedAt,
    source: 'device'
  };
}

/**
 * Update the latest vehicle point only when the incoming timestamp is newer.
 * @param {object} ping Persisted ping input.
 * @param {object} vehicle Registered vehicle.
 * @param {object} device Authenticated device.
 * @returns {Promise<void>} Update promise.
 */
async function updateLastLocation(ping, vehicle, device) {
  try {
    await VehicleLastLocation.findOneAndUpdate(
      { vehicleId: vehicle._id, recordedAt: { $lt: ping.recordedAt } },
      {
        $set: {
          provinceId: vehicle.provinceId,
          districtId: vehicle.districtId,
          stationId: vehicle.stationId,
          deviceId: device._id,
          location: ping.location,
          speed: ping.speed,
          heading: ping.heading,
          recordedAt: ping.recordedAt
        },
        $setOnInsert: { vehicleId: vehicle._id }
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    // A newer concurrent upsert may win the unique vehicleId race.
    if (error.code !== 11000) throw error;
  }
}

/**
 * Persist one or many device pings, skipping duplicate unique-index conflicts.
 * @param {object} device Authenticated device document.
 * @param {object[]} inputs Validated ping payloads.
 * @returns {Promise<{accepted: number, duplicates: number}>} Write counts.
 */
export async function recordDevicePings(device, inputs) {
  const vehicle = await Vehicle.findById(device.vehicleId).lean();
  if (!vehicle) throw apiError(404, 'Device vehicle not found');
  const documents = inputs.map((ping) => toPingDocument(ping, device, vehicle));
  let duplicates = 0;
  try {
    await LocationPing.insertMany(documents, { ordered: false });
  } catch (error) {
    const writeErrors = error.writeErrors || error.result?.writeErrors || error.result?.result?.writeErrors || [];
    const duplicateErrors = writeErrors.filter((item) => item.code === 11000 || item.err?.code === 11000);
    const hasDuplicateCode = error.code === 11000 || error.err?.code === 11000;
    const hasOtherWriteError = writeErrors.some((item) => item.code !== 11000 && item.err?.code !== 11000);
    if (hasOtherWriteError || (!duplicateErrors.length && !hasDuplicateCode)) throw error;
    duplicates = duplicateErrors.length || 1;
  }
  for (const document of documents) await updateLastLocation(document, vehicle, device);
  return { accepted: documents.length - duplicates, duplicates };
}

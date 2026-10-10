import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = path.resolve(new URL('..', import.meta.url).pathname);
const keysFile = process.env.DEVICE_KEYS_FILE || path.join(projectRoot, 'device-keys.json');
const stateFile = process.env.SIMULATOR_STATE_FILE || path.join(projectRoot, 'simulator', 'state.json');
const apiUrl = (process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '');
const intervalSeconds = Number(process.env.PING_INTERVAL_SECONDS || 30);
const once = process.argv.includes('--once');
const intervalOverride = process.argv.find((argument) => argument.startsWith('--interval='));
const interval = intervalOverride ? Number(intervalOverride.split('=')[1]) : intervalSeconds;

const startingPoints = [
  [6.9271, 79.8612], [7.2906, 80.6337], [6.0329, 80.2168], [7.4863, 80.3647],
  [8.3114, 80.4037], [7.7310, 81.6747], [9.6615, 80.0255], [6.6828, 80.3992]
];

/**
 * Read a JSON file, returning a fallback when it does not exist.
 * @param {string} filename JSON file path.
 * @param {unknown} fallback Fallback value.
 * @returns {Promise<unknown>} Parsed JSON or fallback.
 */
async function readJson(filename, fallback) {
  try {
    return JSON.parse(await fs.readFile(filename, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

/**
 * Keep a latitude/longitude inside the Sri Lankan API validation bounds.
 * @param {number} latitude Latitude.
 * @param {number} longitude Longitude.
 * @returns {{latitude: number, longitude: number}} Bounded coordinate.
 */
function clampLocation(latitude, longitude) {
  return {
    latitude: Math.min(9.9, Math.max(5.8, latitude)),
    longitude: Math.min(81.9, Math.max(79.5, longitude))
  };
}

/**
 * Continue one vehicle's route with a random-walk movement step.
 * @param {{latitude: number, longitude: number, heading?: number}} previous Previous point.
 * @param {number} elapsedSeconds Time since the previous ping.
 * @returns {{latitude: number, longitude: number, speed: number, heading: number}} New ping movement.
 */
function nextMovement(previous, elapsedSeconds) {
  const heading = (Number(previous.heading || Math.random() * 360) + (Math.random() - 0.5) * 45 + 360) % 360;
  const speed = 15 + Math.random() * 45;
  const distanceKm = speed * elapsedSeconds / 3600;
  const radians = heading * Math.PI / 180;
  const latitude = previous.latitude + (Math.cos(radians) * distanceKm) / 111;
  const longitude = previous.longitude + (Math.sin(radians) * distanceKm) / (111 * Math.cos(previous.latitude * Math.PI / 180));
  return { ...clampLocation(latitude, longitude), speed, heading };
}

/**
 * Send one batch request for a device key and return its API result.
 * The server batch endpoint is used even for one current ping so the simulator
 * exercises the same ingestion path as buffered device clients.
 * @param {{deviceId: string, plainKey: string}} device Device key record.
 * @param {object} ping Location ping payload.
 * @returns {Promise<object>} API response.
 */
async function sendPing(device, ping) {
  const response = await fetch(`${apiUrl}/api/v1/devices/${device.deviceId}/pings/batch`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Device-Key': device.plainKey },
    body: JSON.stringify([ping])
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { message: text };
  }
  if (!response.ok) throw new Error(`${response.status}: ${body.message || body.error?.message || text}`);
  return body;
}

/**
 * Generate and submit one ping for every configured device.
 * @param {Array<{deviceId: string, plainKey: string}>} devices Device key records.
 * @param {Record<string, object>} state Persistent simulator positions.
 * @returns {Promise<Record<string, object>>} Updated simulator state.
 */
async function runTick(devices, state) {
  const now = Date.now();
  const elapsedSeconds = interval;
  const results = await Promise.allSettled(devices.map(async (device, index) => {
    const previous = state[device.deviceId] || {
      ...clampLocation(...startingPoints[index % startingPoints.length]),
      heading: (index * 37) % 360
    };
    const movement = nextMovement(previous, elapsedSeconds);
    const ping = {
      latitude: movement.latitude,
      longitude: movement.longitude,
      speed: Number(movement.speed.toFixed(2)),
      heading: Number(movement.heading.toFixed(2)),
      recordedAt: new Date(now).toISOString()
    };
    const result = await sendPing(device, ping);
    state[device.deviceId] = { ...ping, heading: ping.heading };
    return { deviceId: device.deviceId, result };
  }));
  const failed = results.filter((result) => result.status === 'rejected');
  const accepted = results.filter((result) => result.status === 'fulfilled')
    .reduce((total, result) => total + Number(result.value.result.accepted || 0), 0);
  const duplicates = results.filter((result) => result.status === 'fulfilled')
    .reduce((total, result) => total + Number(result.value.result.duplicates || 0), 0);
  console.log(`${new Date(now).toISOString()} devices=${devices.length} accepted=${accepted} duplicates=${duplicates} failed=${failed.length}`);
  for (const result of failed.slice(0, 5)) console.error(`Simulator device failure: ${result.reason.message}`);
  await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
  return state;
}

/**
 * Start the simulator CLI.
 * @returns {Promise<void>} Startup promise.
 */
async function main() {
  if (!Number.isFinite(interval) || interval < 1) throw new Error('Interval must be at least 1 second');
  const devices = await readJson(keysFile, []);
  if (!Array.isArray(devices) || devices.length === 0) throw new Error(`No device keys found at ${keysFile}. Run npm run seed:coursework first.`);
  const state = await readJson(stateFile, {});
  await runTick(devices, state);
  if (once) return;
  const timer = setInterval(() => runTick(devices, state).catch((error) => console.error(`Simulator tick failed: ${error.message}`)), interval * 1000);
  const shutdown = () => {
    clearInterval(timer);
    fs.writeFile(stateFile, JSON.stringify(state, null, 2)).finally(() => process.exit(0));
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(`Simulator failed: ${error.message}`);
  process.exitCode = 1;
});

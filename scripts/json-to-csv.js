import fs from 'fs';
import path from 'path';

const file = path.resolve('data', 'simulation-data.json');
const outBuses = path.resolve('data', 'simulation-tuks.csv');
const outRoutes = path.resolve('data', 'simulation-routes.csv');

function flatten(obj) {
  const res = {};
  function rec(o, prefix = '') {
    for (const k of Object.keys(o)) {
      const val = o[k];
      const key = prefix ? `${prefix}.${k}` : k;
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        rec(val, key);
      } else {
        res[key] = Array.isArray(val) ? JSON.stringify(val) : val;
      }
    }
  }
  rec(obj);
  return res;
}

(async function() {
  try {
    const raw = await fs.promises.readFile(file, 'utf8');
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') throw new Error('Expected object in simulation-data.json');

    // buses
    if (Array.isArray(data.buses)) {
      // rename busId to tukId in output
      const mapped = data.buses.map(b => ({ ...b, tukId: b.busId }));
      const rows = mapped.map(flatten);
      const headers = Array.from(rows.reduce((s, r) => { Object.keys(r).forEach(k=>s.add(k)); return s; }, new Set()));
      const csv = [headers.join(',')]
        .concat(rows.map(r => headers.map(h => {
          const v = r[h] === undefined || r[h] === null ? '' : String(r[h]).replace(/"/g, '""');
          if (v.includes(',') || v.includes('\n') || v.includes('\"')) return `"${v}"`;
          return v;
        }).join(','))).join('\n');
      await fs.promises.writeFile(outBuses, csv, 'utf8');
      console.log('Wrote', outBuses);
    }

    // routes
    if (Array.isArray(data.routes)) {
      const rows = data.routes.map(flatten);
      const headers = Array.from(rows.reduce((s, r) => { Object.keys(r).forEach(k=>s.add(k)); return s; }, new Set()));
      const csv = [headers.join(',')]
        .concat(rows.map(r => headers.map(h => {
          const v = r[h] === undefined || r[h] === null ? '' : String(r[h]).replace(/"/g, '""');
          if (v.includes(',') || v.includes('\n') || v.includes('\"')) return `"${v}"`;
          return v;
        }).join(','))).join('\n');
      await fs.promises.writeFile(outRoutes, csv, 'utf8');
      console.log('Wrote', outRoutes);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

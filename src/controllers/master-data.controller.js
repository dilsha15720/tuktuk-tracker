import Province from '../models/province.model.js';
import District from '../models/district.model.js';
import PoliceStation from '../models/police-station.model.js';

export const getProvinces = async (req, res) => {
  const provinces = await Province.find().sort({ name: 1 });
  res.json(provinces);
};

export const getDistricts = async (req, res) => {
  const filter = {};
  if (req.query.province) {
    const province = await Province.findOne({
      $or: [{ _id: req.query.province }, { code: req.query.province.toUpperCase() }]
    });
    if (!province) return res.status(404).json({ message: 'Province not found' });
    filter.province = province._id;
  }
  const districts = await District.find(filter).populate('province').sort({ name: 1 });
  res.json(districts);
};

export const getPoliceStations = async (req, res) => {
  const filter = {};
  if (req.query.district) {
    const district = await District.findOne({
      $or: [{ _id: req.query.district }, { code: req.query.district.toUpperCase() }]
    });
    if (!district) return res.status(404).json({ message: 'District not found' });
    filter.district = district._id;
  }
  const stations = await PoliceStation.find(filter).populate({
    path: 'district',
    populate: { path: 'province' }
  }).sort({ name: 1 });
  res.json(stations);
};

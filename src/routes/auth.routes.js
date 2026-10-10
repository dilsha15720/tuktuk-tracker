import express from 'express';
import jwt from 'jsonwebtoken';
const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = [
    { username: process.env.ADMIN_USER, password: process.env.ADMIN_PASS, role: 'admin' },
    { username: process.env.OPERATOR_USER, password: process.env.OPERATOR_PASS, role: 'operator' }
  ];
  const user = users.find((candidate) => candidate.username && candidate.password && candidate.username === username && candidate.password === password);
  if (user) {
    const token = jwt.sign({ username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, role: user.role });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

export default router;

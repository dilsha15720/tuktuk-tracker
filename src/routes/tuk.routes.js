import express from 'express';
import * as tukController from '../controllers/tuk.controller.fixed.js';
import { authMiddleware } from '../utils/auth.js';

const router = express.Router();

router.get('/', tukController.getAllTuks);
router.get('/:id', tukController.getTukById);
router.get('/:id/location', tukController.getTukLocation);
router.post('/', authMiddleware, tukController.createTuk);
router.post('/:id/location', authMiddleware, tukController.updateTukLocation);

export default router;
import express from 'express';
import * as tukController from '../controllers/tuk.controller.fixed.js';
import { authMiddleware } from '../utils/auth.js';

const router = express.Router();

router.get('/', tukController.getAllTuks);
router.get('/:id', tukController.getTukById);
router.get('/:id/location', tukController.getTukLocation);
router.post('/', authMiddleware, tukController.createTuk);
router.post('/:id/location', authMiddleware, tukController.updateTukLocation);

export default router;
import express from 'express';
import * as tukController from '../controllers/tuk.controller.fixed.js';
import { authMiddleware } from '../utils/auth.js';

const router = express.Router();

router.get('/', tukController.getAllTuks);
router.get('/:id', tukController.getTukById);
router.get('/:id/location', tukController.getTukLocation);
router.post('/', authMiddleware, tukController.createTuk);
router.post('/:id/location', authMiddleware, tukController.updateTukLocation);

export default router;
import express from 'express';
import * as tukController from '../controllers/tuk.controller.fixed.js';
import { authMiddleware } from '../utils/auth.js';

const router = express.Router();

router.get('/', tukController.getAllTuks);
router.get('/:id', tukController.getTukById);
router.get('/:id/location', tukController.getTukLocation);
router.post('/', authMiddleware, tukController.createTuk);
router.post('/:id/location', authMiddleware, tukController.updateTukLocation);

export default router;
import express from 'express';
import * as tukController from '../controllers/tuk.controller.fixed.js';
import { authMiddleware } from '../utils/auth.js';

const router = express.Router();

router.get('/', tukController.getAllTuks);
router.get('/:id', tukController.getTukById);
router.get('/:id/location', tukController.getTukLocation);
router.post('/', authMiddleware, tukController.createTuk);
router.post('/:id/location', authMiddleware, tukController.updateTukLocation);

export default router;
import express from 'express';
import * as tukController from '../controllers/tuk.controller.fixed.js';
import { authMiddleware } from '../utils/auth.js';

const router = express.Router();

router.get('/', tukController.getAllTuks);
router.get('/:id', tukController.getTukById);
router.get('/:id/location', tukController.getTukLocation);
router.post('/', authMiddleware, tukController.createTuk);
router.post('/:id/location', authMiddleware, tukController.updateTukLocation);

export default router;
// Removed duplicate code and markdown remnants
import express from 'express';
import * as tukController from '../controllers/tuk.controller.fixed.js';
import { authMiddleware } from '../utils/auth.js';

const router = express.Router();

router.get('/', tukController.getAllTuks);
router.get('/:id', tukController.getTukById);
router.get('/:id/location', tukController.getTukLocation);
router.post('/', authMiddleware, tukController.createTuk);
router.post('/:id/location', authMiddleware, tukController.updateTukLocation);

export default router;
```javascript
// Removed duplicate code and markdown remnants

```

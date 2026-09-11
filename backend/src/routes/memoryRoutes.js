const express = require('express');
const router = express.Router();
const { getVillageMemory, getMemoryHotspotById } = require('../controllers/memoryController');

router.get('/', getVillageMemory);
router.get('/:id', getMemoryHotspotById);

module.exports = router;

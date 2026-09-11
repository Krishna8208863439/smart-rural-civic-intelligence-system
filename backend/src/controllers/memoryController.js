const VillageDigitalMemoryService = require('../services/VillageDigitalMemoryService');

// @desc    Get Village Digital Memory records
// @route   GET /api/village-memory
// @access  Public / Private
exports.getVillageMemory = async (req, res) => {
  try {
    const { category, riskLevel, search, limit } = req.query;

    const records = await VillageDigitalMemoryService.getMemoryRecords({
      category,
      riskLevel,
      search,
      limit: limit ? Number(limit) : 50,
    });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error('Village memory error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving Village Digital Memory' });
  }
};

// @desc    Get specific hotspot profile with full historical context
// @route   GET /api/village-memory/:id
// @access  Public / Private
exports.getMemoryHotspotById = async (req, res) => {
  try {
    const details = await VillageDigitalMemoryService.getHotspotDetail(req.params.id);

    if (!details) {
      return res.status(404).json({ success: false, message: 'Village memory profile not found' });
    }

    res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error('Hotspot memory detail error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving memory profile' });
  }
};

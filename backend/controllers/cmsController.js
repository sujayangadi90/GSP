const CmsContent = require('../models/CmsContent');

// @desc    Get all CMS sections or a specific key
// @route   GET /api/cms
// @access  Public
const getCmsContent = async (req, res) => {
  try {
    const contents = await CmsContent.find({});
    // Map list to a single key-value object
    const result = {};
    contents.forEach(item => {
      result[item.key] = item.value;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a specific CMS key
// @route   POST /api/cms/:key
// @access  Private (Admin)
const updateCmsContent = async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  try {
    let item = await CmsContent.findOne({ key });
    if (item) {
      item.value = value;
      await item.save();
    } else {
      item = await CmsContent.create({ key, value });
    }
    res.json({ message: `CMS section [${key}] updated successfully`, item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCmsContent, updateCmsContent };

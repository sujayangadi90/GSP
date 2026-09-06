const express = require('express');
const {
  createItem,
  getItems,
  updateItem,
  stockIn,
  stockOut,
  scanImportFile,
  downloadUnsuitableFile,
  confirmImport,
  downloadTemplate
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { excelUpload } = require('../middleware/upload');
const router = express.Router();

router.use(protect);

router.route('/upload')
  .post(authorize('admin'), upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }
    res.status(200).json({ filePath: 'uploads/' + req.file.filename });
  });

router.route('/scan-excel')
  .post(authorize('admin'), excelUpload.single('file'), scanImportFile);

router.route('/export-unsuitable')
  .post(authorize('admin'), downloadUnsuitableFile);

router.route('/confirm-import')
  .post(authorize('admin'), confirmImport);

router.route('/export-template')
  .get(authorize('admin'), downloadTemplate);

router.route('/')
  .get(getItems)
  .post(authorize('admin'), createItem);

router.route('/:id')
  .put(authorize('admin'), updateItem);

router.route('/:id/stock-in')
  .post(authorize('admin'), stockIn);

router.route('/:id/stock-out')
  .post(authorize('admin'), stockOut);

module.exports = router;


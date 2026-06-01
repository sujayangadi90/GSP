const express = require('express');
const router = express.Router();
const { getBrands, createBrand, updateBrand, deleteBrand } = require('../controllers/brandController');
const { protect } = require('../middleware/auth');

router.get('/', getBrands);
router.post('/', protect, createBrand);
router.put('/:id', protect, updateBrand);
router.delete('/:id', protect, deleteBrand);

module.exports = router;

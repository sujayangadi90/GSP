const express = require('express');
const router = express.Router();
const {
  getCategories, createCategory, updateCategory, deleteCategory,
  getServices, getServiceBySlug, createService, updateService, deleteService
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');

// Categories
router.get('/categories', getCategories);
router.post('/categories', protect, createCategory);
router.put('/categories/:id', protect, updateCategory);
router.delete('/categories/:id', protect, deleteCategory);

// Services
router.get('/', getServices);
router.get('/slug/:slug', getServiceBySlug);
router.post('/', protect, createService);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;

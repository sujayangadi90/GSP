const ServiceCategory = require('../models/ServiceCategory');
const Service = require('../models/Service');

// --- CATEGORIES ---

// @desc    Get all active service categories
// @route   GET /api/services/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find({}).sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/services/categories
// @access  Private (Admin)
const createCategory = async (req, res) => {
  const { name, slug, description, isActive, order } = req.body;

  try {
    const exists = await ServiceCategory.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: 'Category with this slug already exists' });
    }

    const category = await ServiceCategory.create({ 
      name, 
      slug, 
      description, 
      isActive, 
      order: order !== undefined ? Number(order) : 0 
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/services/categories/:id
// @access  Private (Admin)
const updateCategory = async (req, res) => {
  const { name, slug, description, isActive, order } = req.body;

  try {
    const category = await ServiceCategory.findById(req.params.id);
    if (category) {
      category.name = name || category.name;
      category.slug = slug || category.slug;
      category.description = description !== undefined ? description : category.description;
      category.isActive = isActive !== undefined ? isActive : category.isActive;
      category.order = order !== undefined ? Number(order) : category.order;

      const updated = await category.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/services/categories/:id
// @access  Private (Admin)
const deleteCategory = async (req, res) => {
  try {
    const category = await ServiceCategory.findById(req.params.id);
    if (category) {
      // Check if services are tied to this category
      const count = await Service.countDocuments({ category: category._id });
      if (count > 0) {
        return res.status(400).json({ message: 'Cannot delete category containing active services' });
      }
      await category.deleteOne();
      res.json({ message: 'Category removed successfully' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- SERVICES ---

// @desc    Get all active services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const services = await Service.find({}).populate('category');
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single service by slug
// @route   GET /api/services/slug/:slug
// @access  Public
const getServiceBySlug = async (req, res) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug }).populate('category');
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private (Admin)
const createService = async (req, res) => {
  const { category, name, slug, image, shortDescription, detailedDescription, features, benefits, serviceTypes, isActive, metaTitle, metaDescription } = req.body;

  try {
    const exists = await Service.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: 'Service with this slug already exists' });
    }

    const service = await Service.create({
      category, name, slug, image, shortDescription, detailedDescription, features, benefits, serviceTypes, isActive, metaTitle, metaDescription
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private (Admin)
const updateService = async (req, res) => {
  const { category, name, slug, image, shortDescription, detailedDescription, features, benefits, serviceTypes, isActive, metaTitle, metaDescription } = req.body;

  try {
    const service = await Service.findById(req.params.id);
    if (service) {
      service.category = category || service.category;
      service.name = name || service.name;
      service.slug = slug || service.slug;
      service.image = image !== undefined ? image : service.image;
      service.shortDescription = shortDescription || service.shortDescription;
      service.detailedDescription = detailedDescription !== undefined ? detailedDescription : service.detailedDescription;
      service.features = features || service.features;
      service.benefits = benefits || service.benefits;
      service.serviceTypes = serviceTypes || service.serviceTypes;
      service.isActive = isActive !== undefined ? isActive : service.isActive;
      service.metaTitle = metaTitle !== undefined ? metaTitle : service.metaTitle;
      service.metaDescription = metaDescription !== undefined ? metaDescription : service.metaDescription;

      const updated = await service.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private (Admin)
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (service) {
      await service.deleteOne();
      res.json({ message: 'Service removed successfully' });
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getServices,
  getServiceBySlug,
  createService,
  updateService,
  deleteService
};

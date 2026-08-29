const InventoryItem = require('../models/InventoryItem');

// @desc    Create new inventory item
// @route   POST /api/inventory
// @access  Private/Admin
const createItem = async (req, res) => {
  const { name, sku, quantity, minStockLevel, sellingPrice } = req.body;

  try {
    const itemExists = await InventoryItem.findOne({ sku: sku.trim() });
    if (itemExists) {
      return res.status(400).json({ message: 'Item with this SKU already exists' });
    }

    const item = new InventoryItem({
      name: name.trim(),
      sku: sku.trim(),
      quantity: Number(quantity) || 0,
      minStockLevel: Number(minStockLevel) || 5,
      sellingPrice: Number(sellingPrice) || 0
    });

    // Record initial stock transaction if quantity > 0
    if (Number(quantity) > 0) {
      item.transactions.push({
        type: 'stock_in',
        quantity: Number(quantity),
        user: req.user ? req.user.name : 'Admin'
      });
    }

    const savedItem = await item.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all inventory items (with optional filters)
// @route   GET /api/inventory
// @access  Private/Admin
const getItems = async (req, res) => {
  try {
    const { search, lowStock } = req.query;

    let query = {};
    if (search) {
      const s = search.toLowerCase();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { sku: { $regex: s, $options: 'i' } }
      ];
    }

    let items = await InventoryItem.find(query).sort({ createdAt: -1 });

    if (lowStock === 'true') {
      items = items.filter(item => item.quantity <= item.minStockLevel);
    }

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update inventory item details
// @route   PUT /api/inventory/:id
// @access  Private/Admin
const updateItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const { name, sku, minStockLevel, sellingPrice } = req.body;

    if (sku && sku.trim() !== item.sku) {
      const exists = await InventoryItem.findOne({ sku: sku.trim() });
      if (exists) {
        return res.status(400).json({ message: 'Another item with this SKU already exists' });
      }
      item.sku = sku.trim();
    }

    item.name = name ? name.trim() : item.name;
    item.minStockLevel = minStockLevel !== undefined ? Number(minStockLevel) : item.minStockLevel;
    item.sellingPrice = sellingPrice !== undefined ? Number(sellingPrice) : item.sellingPrice;

    const updated = await item.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add stock (Stock In)
// @route   POST /api/inventory/:id/stock-in
// @access  Private/Admin
const stockIn = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const qty = Number(req.body.quantity);
    if (!qty || qty <= 0) {
      return res.status(400).json({ message: 'Please enter a valid positive quantity' });
    }

    item.quantity += qty;
    item.transactions.push({
      type: 'stock_in',
      quantity: qty,
      user: req.user ? req.user.name : 'Admin'
    });

    const updated = await item.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove stock (Stock Out)
// @route   POST /api/inventory/:id/stock-out
// @access  Private/Admin
const stockOut = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const qty = Number(req.body.quantity);
    if (!qty || qty <= 0) {
      return res.status(400).json({ message: 'Please enter a valid positive quantity' });
    }

    if (qty > item.quantity) {
      return res.status(400).json({ message: `Insufficient stock. Current available: ${item.quantity}` });
    }

    item.quantity -= qty;
    item.transactions.push({
      type: 'stock_out',
      quantity: qty,
      user: req.user ? req.user.name : 'Admin'
    });

    const updated = await item.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createItem,
  getItems,
  updateItem,
  stockIn,
  stockOut
};

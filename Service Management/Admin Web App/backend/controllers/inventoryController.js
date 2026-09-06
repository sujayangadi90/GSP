const InventoryItem = require('../models/InventoryItem');
const User = require('../models/User');

let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.warn('xlsx module not found, fallback CSV handling will be used');
}

const parseCSVText = (csvString) => {
  const lines = csvString.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];
  
  const parseLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    return values;
  };

  const headers = parseLine(lines[0]);
  const resultRows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = vals[idx] !== undefined ? vals[idx] : '';
    });
    resultRows.push(rowObj);
  }
  return resultRows;
};


// @desc    Create new inventory item
// @route   POST /api/inventory
// @access  Private/Admin
const createItem = async (req, res) => {
  const { name, sku, image, quantity, minStockLevel, sellingPrice } = req.body;

  try {
    const itemExists = await InventoryItem.findOne({ sku: sku.trim() });
    if (itemExists) {
      return res.status(400).json({ message: 'Item with this SKU already exists' });
    }

    const item = new InventoryItem({
      name: name.trim(),
      sku: sku.trim(),
      image: image ? image.trim() : '',
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

    const { name, sku, image, minStockLevel, sellingPrice } = req.body;

    if (sku && sku.trim() !== item.sku) {
      const exists = await InventoryItem.findOne({ sku: sku.trim() });
      if (exists) {
        return res.status(400).json({ message: 'Another item with this SKU already exists' });
      }
      item.sku = sku.trim();
    }

    item.name = name ? name.trim() : item.name;
    if (image !== undefined) {
      item.image = image ? image.trim() : '';
    }
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

    const { technicianId, technicianName } = req.body;
    let resolvedTechName = technicianName || '';
    if (technicianId && !resolvedTechName) {
      const tech = await User.findById(technicianId);
      if (tech) resolvedTechName = tech.name;
    }

    item.quantity -= qty;
    item.transactions.push({
      type: 'stock_out',
      quantity: qty,
      user: req.user ? req.user.name : 'Admin',
      technician: technicianId || null,
      technicianName: resolvedTechName
    });

    const updated = await item.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Scan and validate uploaded Excel / CSV file
// @route   POST /api/inventory/scan-excel
// @access  Private/Admin
const scanImportFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel (.xlsx, .xls) or CSV file' });
    }

    let rows = [];
    if (XLSX) {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      if (firstSheetName) {
        const sheet = workbook.Sheets[firstSheetName];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      }
    } else {
      const text = req.file.buffer.toString('utf8');
      rows = parseCSVText(text);
    }

    if (!rows || rows.length === 0) {
      return res.status(400).json({ message: 'No rows found in the uploaded file' });
    }

    const validRecords = [];
    const unsuitableRecords = [];
    const seenSKUsInFile = new Set();

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // Row 1 is header
      
      const getField = (aliases) => {
        for (const key of Object.keys(row)) {
          const cleanKey = key.trim().toLowerCase();
          if (aliases.includes(cleanKey)) {
            return String(row[key]).trim();
          }
        }
        return '';
      };

      const sku = getField(['sku', 'product code', 'item code', 'part number', 'code']);
      const name = getField(['name', 'item name', 'product name', 'part name', 'title']);
      const quantityRaw = getField(['available stock', 'quantity', 'stock', 'qty', 'initial stock']);
      const minStockRaw = getField(['min stock level', 'min stock', 'minimum stock', 'min level']);
      const sellingPriceRaw = getField(['selling price', 'price', 'unit price', 'rate']);
      const image = getField(['image', 'image url', 'img', 'photo']);

      let reasons = [];

      if (!sku) {
        reasons.push('SKU is required');
      } else if (seenSKUsInFile.has(sku.toLowerCase())) {
        reasons.push(`Duplicate SKU "${sku}" within uploaded file`);
      }

      if (!name) {
        reasons.push('Item Name is required');
      }

      let quantity = 0;
      if (quantityRaw !== '') {
        const parsedQty = Number(quantityRaw);
        if (isNaN(parsedQty) || parsedQty < 0) {
          reasons.push('Available Stock must be a valid non-negative number');
        } else {
          quantity = parsedQty;
        }
      }

      let minStockLevel = 5;
      if (minStockRaw !== '') {
        const parsedMin = Number(minStockRaw);
        if (isNaN(parsedMin) || parsedMin < 0) {
          reasons.push('Min Stock Level must be a valid non-negative number');
        } else {
          minStockLevel = parsedMin;
        }
      }

      let sellingPrice = 0;
      if (sellingPriceRaw !== '') {
        const parsedPrice = Number(sellingPriceRaw);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          reasons.push('Selling Price must be a valid non-negative number');
        } else {
          sellingPrice = parsedPrice;
        }
      }

      const itemPayload = {
        rowNum,
        sku,
        name,
        quantity,
        minStockLevel,
        sellingPrice,
        image
      };

      if (reasons.length > 0) {
        unsuitableRecords.push({
          ...itemPayload,
          reason: reasons.join('; ')
        });
      } else {
        seenSKUsInFile.add(sku.toLowerCase());
        validRecords.push(itemPayload);
      }
    });

    // Query database to detect existing SKUs that will be updated
    const validSkus = validRecords.map(r => r.sku);
    const existingDbItems = await InventoryItem.find({ sku: { $in: validSkus } }).select('sku name quantity');
    const existingSkuMap = new Map();
    existingDbItems.forEach(item => {
      existingSkuMap.set(item.sku.toLowerCase(), item);
    });

    const existingRecords = [];
    const newRecords = [];

    validRecords.forEach(record => {
      const existingInDb = existingSkuMap.get(record.sku.toLowerCase());
      if (existingInDb) {
        existingRecords.push({
          ...record,
          existingName: existingInDb.name,
          currentQuantity: existingInDb.quantity
        });
      } else {
        newRecords.push(record);
      }
    });

    res.json({
      totalRecords: rows.length,
      validCount: validRecords.length,
      unsuitableCount: unsuitableRecords.length,
      newCount: newRecords.length,
      existingCount: existingRecords.length,
      validRecords,
      unsuitableRecords,
      existingRecords,
      newRecords
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to scan file' });
  }
};


// @desc    Export unsuitable records as an Excel file
// @route   POST /api/inventory/export-unsuitable
// @access  Private/Admin
const downloadUnsuitableFile = async (req, res) => {
  try {
    const { unsuitableRecords } = req.body;
    if (!Array.isArray(unsuitableRecords) || unsuitableRecords.length === 0) {
      return res.status(400).json({ message: 'No unsuitable records provided for export' });
    }

    const exportRows = unsuitableRecords.map(item => ({
      'Row #': item.rowNum || '',
      'SKU': item.sku || '',
      'Item Name': item.name || '',
      'Available Stock': item.quantity !== undefined ? item.quantity : '',
      'Min Stock Level': item.minStockLevel !== undefined ? item.minStockLevel : '',
      'Selling Price': item.sellingPrice !== undefined ? item.sellingPrice : '',
      'Image URL': item.image || '',
      'Error Reason': item.reason || ''
    }));

    if (XLSX) {
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Unsuitable Records');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="unsuitable_inventory_records.xlsx"');
      return res.send(buffer);
    } else {
      const headers = Object.keys(exportRows[0]).join(',');
      const bodyLines = exportRows.map(r => Object.values(r).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
      const csvStr = headers + '\n' + bodyLines.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="unsuitable_inventory_records.csv"');
      return res.send(csvStr);
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to export unsuitable records' });
  }
};

// @desc    Confirm and bulk import valid items
// @route   POST /api/inventory/confirm-import
// @access  Private/Admin
const confirmImport = async (req, res) => {
  try {
    const { validRecords } = req.body;
    if (!Array.isArray(validRecords) || validRecords.length === 0) {
      return res.status(400).json({ message: 'No valid records provided for import' });
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of validRecords) {
      const { sku, name, quantity, minStockLevel, sellingPrice, image } = item;
      const cleanSku = String(sku).trim();
      let existingItem = await InventoryItem.findOne({ sku: cleanSku });

      if (existingItem) {
        existingItem.name = String(name).trim();
        if (image !== undefined && image !== null) existingItem.image = String(image).trim();
        if (minStockLevel !== undefined) existingItem.minStockLevel = Number(minStockLevel);
        if (sellingPrice !== undefined) existingItem.sellingPrice = Number(sellingPrice);

        const addQty = Number(quantity) || 0;
        if (addQty > 0) {
          existingItem.quantity += addQty;
          existingItem.transactions.push({
            type: 'stock_in',
            quantity: addQty,
            user: req.user ? req.user.name : 'Admin'
          });
        }
        await existingItem.save();
        updatedCount++;
      } else {
        const newItem = new InventoryItem({
          name: String(name).trim(),
          sku: cleanSku,
          image: image ? String(image).trim() : '',
          quantity: Number(quantity) || 0,
          minStockLevel: Number(minStockLevel) || 5,
          sellingPrice: Number(sellingPrice) || 0
        });

        if (Number(quantity) > 0) {
          newItem.transactions.push({
            type: 'stock_in',
            quantity: Number(quantity),
            user: req.user ? req.user.name : 'Admin'
          });
        }
        await newItem.save();
        createdCount++;
      }
    }

    res.json({
      message: `Import complete! ${createdCount} items created, ${updatedCount} items updated.`,
      createdCount,
      updatedCount,
      totalImported: validRecords.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to confirm import' });
  }
};

// @desc    Download Excel template for inventory import
// @route   GET /api/inventory/export-template
// @access  Private/Admin
const downloadTemplate = async (req, res) => {
  try {
    const templateRows = [
      {
        'SKU': 'SKU-101',
        'Item Name': 'LED Bulb 12W',
        'Available Stock': 50,
        'Min Stock Level': 10,
        'Selling Price': 150,
        'Image URL': 'https://example.com/bulb.jpg'
      },
      {
        'SKU': 'SKU-102',
        'Item Name': 'Thermostat Digital Small',
        'Available Stock': 20,
        'Min Stock Level': 5,
        'Selling Price': 1200,
        'Image URL': ''
      }
    ];

    if (XLSX) {
      const worksheet = XLSX.utils.json_to_sheet(templateRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Template');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory_import_template.xlsx"');
      return res.send(buffer);
    } else {
      const csvContent = "SKU,Item Name,Available Stock,Min Stock Level,Selling Price,Image URL\n" +
        "SKU-101,LED Bulb 12W,50,10,150,https://example.com/bulb.jpg\n" +
        "SKU-102,Thermostat Digital Small,20,5,1200,\n";
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory_import_template.csv"');
      return res.send(csvContent);
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to generate template' });
  }
};


module.exports = {
  createItem,
  getItems,
  updateItem,
  stockIn,
  stockOut,
  scanImportFile,
  downloadUnsuitableFile,
  confirmImport,
  downloadTemplate
};


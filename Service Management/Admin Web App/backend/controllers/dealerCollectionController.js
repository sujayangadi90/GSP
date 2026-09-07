const DealerCollection = require('../models/DealerCollection');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

// Helper to attach fees to tickets (same logic as ticketController.js)
const attachFeesToTickets = async (tickets) => {
  const Brand = require('../models/Brand');
  const brands = await Brand.find({});

  const brandFeeMap = {};
  brands.forEach((b) => {
    if (b.appliance && b.name) {
      const key = `${b.appliance.toString().trim().toLowerCase()}_${b.name.toString().trim().toLowerCase()}`;
      brandFeeMap[key] = {
        serviceFee: b.serviceFee || 0,
        installationFee: b.installationFee || 0,
        dealerServiceFee: b.dealerServiceFee !== undefined ? b.dealerServiceFee : (b.serviceFee || 0),
        dealerInstallationFee: b.dealerInstallationFee !== undefined ? b.dealerInstallationFee : (b.installationFee || 0)
      };
    }
  });

  return tickets.map((t) => {
    const ticketObj = t.toObject ? t.toObject() : t;

    const sType = ticketObj.serviceType || (ticketObj.serviceDetails && ticketObj.serviceDetails.serviceType) || 'In Warranty';
    const iType = ticketObj.installationType || (ticketObj.installationDetails && ticketObj.installationDetails.installationType) || 'Free Installation';
    const isPaidByDealer = (ticketObj.type === 'service' && sType === 'Paid by Dealer') || (ticketObj.type === 'installation' && iType === 'Paid by Dealer');

    let totalPartsPrice = 0;
    const compObj = ticketObj.completion || (ticketObj.completionHistory && ticketObj.completionHistory.length > 0 ? ticketObj.completionHistory[ticketObj.completionHistory.length - 1] : null);
    if (compObj && Array.isArray(compObj.usedParts)) {
      compObj.usedParts.forEach(up => {
        const pPrice = (up.part && typeof up.part === 'object' && up.part.sellingPrice !== undefined)
          ? up.part.sellingPrice
          : (up.sellingPrice !== undefined ? up.sellingPrice : 0);
        const qty = up.quantity || 1;
        totalPartsPrice += (Number(pPrice) || 0) * (Number(qty) || 0);
      });
    }

    if (ticketObj.status === 'completed' || ticketObj.status === 'closed') {
      if (!isPaidByDealer) {
        ticketObj.dealerExpense = 0;
      } else {
        if (ticketObj.dealerExpense !== undefined && ticketObj.dealerExpense !== null && typeof ticketObj.dealerExpense === 'number' && ticketObj.dealerExpense > 0) {
          // Use stored snapshot
        } else {
          const appCategory = (ticketObj.product?.category || '').toString().trim().toLowerCase();
          const brandName = (ticketObj.product?.name || '').toString().trim().toLowerCase();
          const key = `${appCategory}_${brandName}`;
          const brandObj = brandFeeMap[key];

          if (brandObj) {
            let baseDealerFee = null;
            if (ticketObj.type === 'service') {
              baseDealerFee = brandObj.dealerServiceFee !== undefined ? brandObj.dealerServiceFee : (brandObj.serviceFee !== undefined ? brandObj.serviceFee : null);
            } else if (ticketObj.type === 'installation') {
              baseDealerFee = brandObj.dealerInstallationFee !== undefined ? brandObj.dealerInstallationFee : (brandObj.installationFee !== undefined ? brandObj.installationFee : null);
            }

            if (baseDealerFee !== null) {
              ticketObj.dealerExpense = baseDealerFee + totalPartsPrice;
            } else {
              ticketObj.dealerExpense = totalPartsPrice > 0 ? totalPartsPrice : 0;
            }
          } else {
            ticketObj.dealerExpense = totalPartsPrice > 0 ? totalPartsPrice : 0;
          }
        }
      }
    } else {
      ticketObj.dealerExpense = 0;
    }

    return ticketObj;
  });
};

// @desc    Calculate dealer expenses / collection amount for selected month & year
// @route   GET /api/dealer-collections/calculate
// @access  Private (Admin)
const calculateDealerCollection = async (req, res) => {
  try {
    const { dealerId, month, year } = req.query;

    if (!dealerId || !month || !year) {
      return res.status(400).json({ message: 'Dealer, month, and year are required.' });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    const dealerUser = await User.findById(dealerId).select('name code mobile email role contactPerson address city');
    if (!dealerUser || dealerUser.role !== 'dealer') {
      return res.status(404).json({ message: 'Dealer not found.' });
    }

    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const completedTickets = await Ticket.find({
      dealer: dealerId,
      status: { $in: ['completed', 'closed'] },
      $or: [
        { 'completion.submittedAt': { $gte: start, $lte: end } },
        { 'completion.submittedAt': { $exists: false }, createdAt: { $gte: start, $lte: end } },
        { closedAt: { $gte: start, $lte: end } }
      ]
    }).populate('assignedTechnician', 'name code');

    const ticketsWithFees = await attachFeesToTickets(completedTickets);

    let totalCollection = 0;
    let serviceCollection = 0;
    let installationCollection = 0;
    let completedServiceJobsCount = 0;
    let completedInstallationJobsCount = 0;

    ticketsWithFees.forEach((t) => {
      const expense = typeof t.dealerExpense === 'number' ? t.dealerExpense : 0;
      totalCollection += expense;
      if (t.type === 'service') {
        completedServiceJobsCount += 1;
        serviceCollection += expense;
      } else if (t.type === 'installation') {
        completedInstallationJobsCount += 1;
        installationCollection += expense;
      }
    });

    const existingRecord = await DealerCollection.findOne({
      dealer: dealerId,
      month: m,
      year: y
    }).populate('recordedBy', 'name code email');

    return res.json({
      dealer: dealerUser,
      month: m,
      year: y,
      totalCollection,
      completedJobsCount: ticketsWithFees.length,
      completedServiceJobsCount,
      serviceCollection,
      completedInstallationJobsCount,
      installationCollection,
      collectionRecord: existingRecord || null,
      status: existingRecord ? existingRecord.status : 'uncollected'
    });
  } catch (error) {
    console.error('Error in calculateDealerCollection:', error);
    return res.status(500).json({ message: 'Failed to calculate dealer collection', error: error.message });
  }
};

// @desc    Record dealer collection
// @route   POST /api/dealer-collections
// @access  Private (Admin)
const createDealerCollection = async (req, res) => {
  try {
    const { dealerId, month, year, paymentMode, referenceNumber, amount } = req.body;

    if (!dealerId || !month || !year || !paymentMode) {
      return res.status(400).json({ message: 'Dealer, month, year, and payment mode are required.' });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    const dealerUser = await User.findById(dealerId);
    if (!dealerUser || dealerUser.role !== 'dealer') {
      return res.status(404).json({ message: 'Dealer not found.' });
    }

    let record = await DealerCollection.findOne({
      dealer: dealerId,
      month: m,
      year: y
    });

    if (record && record.status === 'collected') {
      return res.status(400).json({
        message: `Collection for ${dealerUser.name} for ${m}/${y} has already been recorded.`
      });
    }

    if (!record) {
      record = new DealerCollection({
        dealer: dealerId,
        month: m,
        year: y
      });
    }

    record.amount = amount !== undefined ? Number(amount) : record.amount;
    record.status = 'collected';
    record.paymentMode = paymentMode;
    record.referenceNumber = referenceNumber ? referenceNumber.trim() : '';
    record.collectedAt = new Date();
    record.recordedBy = req.user._id;

    await record.save();

    const savedRecord = await DealerCollection.findById(record._id)
      .populate('dealer', 'name code mobile email contactPerson')
      .populate('recordedBy', 'name code email');

    return res.status(201).json({
      message: 'Dealer collection recorded successfully',
      collectionRecord: savedRecord
    });
  } catch (error) {
    console.error('Error in createDealerCollection:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A collection record already exists for this dealer and month.' });
    }
    return res.status(500).json({ message: 'Failed to record dealer collection', error: error.message });
  }
};

// @desc    Get all dealer collections with filters
// @route   GET /api/dealer-collections
// @access  Private (Admin)
const getDealerCollections = async (req, res) => {
  try {
    const { dealerId, month, year, paymentMode, page, limit } = req.query;

    let query = {};

    if (req.user.role === 'dealer') {
      query.dealer = req.user._id;
    } else if (dealerId && dealerId !== 'ALL') {
      query.dealer = dealerId;
    }
    if (month && month !== 'ALL') {
      query.month = parseInt(month, 10);
    }
    if (year && year !== 'ALL') {
      query.year = parseInt(year, 10);
    }
    if (paymentMode && paymentMode !== 'ALL') {
      query.paymentMode = paymentMode;
    }

    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 20;
    const skip = (p - 1) * l;

    const collections = await DealerCollection.find(query)
      .populate('dealer', 'name code mobile email contactPerson')
      .populate('recordedBy', 'name code email')
      .sort({ collectedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(l);

    const total = await DealerCollection.countDocuments(query);

    return res.json({
      collections,
      total,
      page: p,
      pages: Math.ceil(total / l)
    });
  } catch (error) {
    console.error('Error in getDealerCollections:', error);
    return res.status(500).json({ message: 'Failed to fetch dealer collection records', error: error.message });
  }
};

module.exports = {
  calculateDealerCollection,
  createDealerCollection,
  getDealerCollections
};

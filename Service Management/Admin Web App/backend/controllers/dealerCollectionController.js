const DealerCollection = require('../models/DealerCollection');
const DealerWalletTransaction = require('../models/DealerWalletTransaction');
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

// Helper to charge dealer wallet (increases Due Amount)
const chargeDealerWallet = async (dealerId, amount, ticketId, description, createdByName = 'System') => {
  if (!dealerId || !amount || amount <= 0) return null;

  // Idempotency check
  if (ticketId) {
    const existing = await DealerWalletTransaction.findOne({ ticket: ticketId, type: 'charge' });
    if (existing) return existing;
  }

  const user = await User.findByIdAndUpdate(
    dealerId,
    { $inc: { dueAmount: amount } },
    { new: true }
  );

  const tx = await DealerWalletTransaction.create({
    dealer: dealerId,
    type: 'charge',
    amount: Number(amount),
    dueAmountAfter: user ? user.dueAmount : amount,
    source: 'ticket_charge',
    ticket: ticketId || null,
    description: description || 'Job charge added to due amount',
    createdByName
  });

  return tx;
};

// Helper to record dealer payment collection (decreases Due Amount)
const creditDealerCollection = async (dealerId, amount, collectionId, paymentMode, referenceNumber, description, createdByName = 'System') => {
  if (!dealerId || !amount || amount <= 0) return null;

  // Idempotency check
  if (collectionId) {
    const existing = await DealerWalletTransaction.findOne({ collectionRecord: collectionId, type: 'collection' });
    if (existing) return existing;
  }

  const user = await User.findByIdAndUpdate(
    dealerId,
    { $inc: { dueAmount: -amount } },
    { new: true }
  );

  const tx = await DealerWalletTransaction.create({
    dealer: dealerId,
    type: 'collection',
    amount: Number(amount),
    dueAmountAfter: user ? user.dueAmount : 0,
    source: 'dealer_payment',
    collectionRecord: collectionId || null,
    paymentMode: paymentMode || '',
    referenceNumber: referenceNumber || '',
    description: description || `Payment collected via ${paymentMode || 'cash'}`,
    createdByName
  });

  return tx;
};

// @desc    Record flexible part payment / collection from dealer
// @route   POST /api/dealer-collections
// @access  Private (Admin)
const createDealerCollection = async (req, res) => {
  try {
    const { dealerId, amount, paymentMode, referenceNumber, notes } = req.body;

    if (!dealerId || !paymentMode) {
      return res.status(400).json({ message: 'Dealer and payment mode are required.' });
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ message: 'Valid collection amount greater than ₹0 is required.' });
    }

    const dealerUser = await User.findById(dealerId);
    if (!dealerUser || dealerUser.role !== 'dealer') {
      return res.status(404).json({ message: 'Dealer not found.' });
    }

    const currentDate = new Date();
    const collectionRecord = new DealerCollection({
      dealer: dealerId,
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      amount: payAmount,
      status: 'collected',
      paymentMode,
      referenceNumber: referenceNumber ? referenceNumber.trim() : (notes || ''),
      collectedAt: currentDate,
      recordedBy: req.user ? req.user._id : null
    });

    await collectionRecord.save();

    // Automatically deduct collected amount from dealer's Due Amount
    try {
      await creditDealerCollection(
        dealerId,
        payAmount,
        collectionRecord._id,
        paymentMode,
        referenceNumber ? referenceNumber.trim() : '',
        `Payment collected via ${paymentMode}${referenceNumber ? ` (Ref: ${referenceNumber})` : ''}`,
        req.user ? req.user.name : 'Admin'
      );
    } catch (walletErr) {
      console.error('Error updating dealer wallet on collection:', walletErr);
    }

    const savedRecord = await DealerCollection.findById(collectionRecord._id)
      .populate('dealer', 'name code mobile email contactPerson dueAmount')
      .populate('recordedBy', 'name code email');

    // Fetch updated dealer due amount
    const updatedDealer = await User.findById(dealerId).select('name code mobile dueAmount');

    return res.status(201).json({
      message: `Collection of ₹${payAmount} successfully recorded for ${dealerUser.name}`,
      collectionRecord: savedRecord,
      dueAmount: updatedDealer ? (updatedDealer.dueAmount || 0) : 0
    });
  } catch (error) {
    console.error('Error in createDealerCollection:', error);
    return res.status(500).json({ message: 'Failed to record dealer collection', error: error.message });
  }
};

// @desc    Get all dealer collection payment history records
// @route   GET /api/dealer-collections
// @access  Private (Admin, Dealer)
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
    const l = parseInt(limit, 10) || 50;
    const skip = (p - 1) * l;

    const collections = await DealerCollection.find(query)
      .populate('dealer', 'name code mobile email contactPerson dueAmount')
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

// @desc    Get dealer wallet (Due Amount) & transaction history
// @route   GET /api/dealer-collections/dealer/:id/wallet
// @access  Private (Admin, Dealer)
const getDealerWallet = async (req, res) => {
  try {
    const rawId = req.params.id || req.query.dealerId;
    const dealerId = (rawId === 'me' && req.user) ? req.user._id : rawId;

    if (!dealerId) {
      return res.status(400).json({ message: 'Dealer ID is required' });
    }

    const dealerUser = await User.findById(dealerId).select('name code email mobile contactPerson dueAmount role status');
    if (!dealerUser || dealerUser.role !== 'dealer') {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    const { type, page, limit } = req.query;
    const query = { dealer: dealerId };

    if (type && ['charge', 'collection', 'adjustment'].includes(type)) {
      query.type = type;
    }

    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 50;
    const skip = (p - 1) * l;

    const transactions = await DealerWalletTransaction.find(query)
      .populate('ticket', 'ticketNumber type status product')
      .populate('collectionRecord', 'amount paymentMode referenceNumber collectedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l);

    const total = await DealerWalletTransaction.countDocuments(query);

    // Live sync calculation check
    const completedTickets = await Ticket.find({
      dealer: dealerId,
      status: { $in: ['completed', 'closed'] }
    });
    const ticketsWithFees = await attachFeesToTickets(completedTickets);
    let totalCharges = 0;
    ticketsWithFees.forEach((t) => {
      totalCharges += typeof t.dealerExpense === 'number' ? t.dealerExpense : 0;
    });

    const collectionsAgg = await DealerCollection.aggregate([
      { $match: { dealer: dealerUser._id } },
      { $group: { _id: null, totalCollected: { $sum: '$amount' } } }
    ]);
    const totalCollected = collectionsAgg.length > 0 ? collectionsAgg[0].totalCollected : 0;
    const computedDueAmount = totalCharges - totalCollected;

    // Update user dueAmount if out of sync
    if (dealerUser.dueAmount !== computedDueAmount) {
      dealerUser.dueAmount = computedDueAmount;
      await dealerUser.save();
    }

    return res.json({
      dealer: dealerUser,
      dueAmount: computedDueAmount,
      totalCharges,
      totalCollected,
      completedJobsCount: completedTickets.length,
      transactions,
      total,
      page: p,
      pages: Math.ceil(total / l)
    });
  } catch (error) {
    console.error('Error in getDealerWallet:', error);
    return res.status(500).json({ message: 'Failed to fetch dealer wallet details', error: error.message });
  }
};

// @desc    Get all wallet transactions across dealers or for a specific dealer
// @route   GET /api/dealer-collections/transactions
// @access  Private (Admin, Dealer)
const getDealerWalletTransactions = async (req, res) => {
  try {
    const { dealerId, type, page, limit } = req.query;
    let query = {};

    if (req.user.role === 'dealer') {
      query.dealer = req.user._id;
    } else if (dealerId && dealerId !== 'ALL') {
      query.dealer = dealerId;
    }

    if (type && type !== 'ALL') {
      query.type = type;
    }

    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 50;
    const skip = (p - 1) * l;

    const transactions = await DealerWalletTransaction.find(query)
      .populate('dealer', 'name code mobile contactPerson')
      .populate('ticket', 'ticketNumber type status product')
      .populate('collectionRecord', 'amount paymentMode referenceNumber collectedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l);

    const total = await DealerWalletTransaction.countDocuments(query);

    return res.json({
      transactions,
      total,
      page: p,
      pages: Math.ceil(total / l)
    });
  } catch (error) {
    console.error('Error in getDealerWalletTransactions:', error);
    return res.status(500).json({ message: 'Failed to fetch dealer wallet transactions', error: error.message });
  }
};

// @desc    Sync past tickets and collections into dealer due amounts & wallet transactions
// @route   POST /api/dealer-collections/sync-wallets
// @access  Private (Admin)
const syncDealerWallets = async (req, res) => {
  try {
    const dealers = await User.find({ role: 'dealer' });
    let updatedCount = 0;

    for (const dealer of dealers) {
      const completedTickets = await Ticket.find({
        dealer: dealer._id,
        status: { $in: ['completed', 'closed'] }
      });
      const ticketsWithFees = await attachFeesToTickets(completedTickets);

      let totalCharges = 0;
      for (const t of ticketsWithFees) {
        const exp = typeof t.dealerExpense === 'number' ? t.dealerExpense : 0;
        totalCharges += exp;

        if (exp > 0) {
          await chargeDealerWallet(
            dealer._id,
            exp,
            t._id,
            `Job charge for Ticket #${t.ticketNumber || t._id}`,
            'System Backfill'
          );
        }
      }

      const collections = await DealerCollection.find({ dealer: dealer._id });
      let totalCollected = 0;
      for (const col of collections) {
        totalCollected += col.amount || 0;
        await creditDealerCollection(
          dealer._id,
          col.amount,
          col._id,
          col.paymentMode,
          col.referenceNumber,
          `Payment collected via ${col.paymentMode}`,
          'System Backfill'
        );
      }

      const dueAmount = totalCharges - totalCollected;
      dealer.dueAmount = dueAmount;
      await dealer.save();
      updatedCount++;
    }

    return res.json({ message: `Successfully synced wallets for ${updatedCount} dealers.` });
  } catch (error) {
    console.error('Error in syncDealerWallets:', error);
    return res.status(500).json({ message: 'Failed to sync dealer wallets', error: error.message });
  }
};

module.exports = {
  chargeDealerWallet,
  creditDealerCollection,
  createDealerCollection,
  getDealerCollections,
  getDealerWallet,
  getDealerWalletTransactions,
  syncDealerWallets
};

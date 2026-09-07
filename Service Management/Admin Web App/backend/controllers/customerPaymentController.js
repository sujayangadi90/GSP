const CustomerPayment = require('../models/CustomerPayment');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

// Helper to calculate total fee for a ticket (base fee + parts total)
const calculateTicketCustomerFee = async (ticket) => {
  const Brand = require('../models/Brand');
  const appCategory = (ticket.product?.category || '').toString().trim().toLowerCase();
  const brandName = (ticket.product?.name || '').toString().trim().toLowerCase();
  
  const brand = await Brand.findOne().populate('appliance');
  const brands = await Brand.find({}).populate('appliance');
  
  let brandObj = null;
  for (const b of brands) {
    const appName = b.appliance ? b.appliance.name.trim().toLowerCase() : '';
    const bName = b.name.trim().toLowerCase();
    if (appName === appCategory && bName === brandName) {
      brandObj = b;
      break;
    }
  }

  let custServiceFee = 0;
  let custInstallFee = 0;
  if (brandObj) {
    custServiceFee = brandObj.customerServiceFee !== undefined ? brandObj.customerServiceFee : (brandObj.serviceFee || 0);
    custInstallFee = brandObj.customerInstallationFee !== undefined ? brandObj.customerInstallationFee : (brandObj.installationFee || 0);
  }

  const sType = ticket.serviceType || (ticket.serviceDetails && ticket.serviceDetails.serviceType) || 'In Warranty';
  const iType = ticket.installationType || (ticket.installationDetails && ticket.installationDetails.installationType) || 'Free Installation';
  
  let baseFee = 0;
  if (ticket.type === 'service' && sType === 'Out Warranty') {
    baseFee = custServiceFee;
  } else if (ticket.type === 'installation' && iType === 'Paid Installation') {
    baseFee = custInstallFee;
  }

  let totalPartsPrice = 0;
  const compObj = ticket.completion || (ticket.completionHistory && ticket.completionHistory.length > 0 ? ticket.completionHistory[ticket.completionHistory.length - 1] : null);
  if (compObj && Array.isArray(compObj.usedParts)) {
    compObj.usedParts.forEach(up => {
      const pPrice = (up.part && typeof up.part === 'object' && up.part.sellingPrice !== undefined)
        ? up.part.sellingPrice
        : (up.sellingPrice !== undefined ? up.sellingPrice : 0);
      const qty = up.quantity || 1;
      totalPartsPrice += (Number(pPrice) || 0) * (Number(qty) || 0);
    });
  }

  return baseFee + totalPartsPrice;
};

// @desc    Get all Customer Payments with pagination & filters (date range, technician)
// @route   GET /api/customer-payments
// @access  Private (Admin)
const getCustomerPayments = async (req, res) => {
  try {
    const { technicianId, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};

    if (technicianId) {
      query.technician = technicianId;
    }

    if (startDate || endDate) {
      query.paidAt = {};
      if (startDate) {
        query.paidAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Include full day of endDate
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.paidAt.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await CustomerPayment.countDocuments(query);

    const payments = await CustomerPayment.find(query)
      .populate({
        path: 'ticket',
        select: 'ticketNumber type product serviceType installationType serviceDetails installationDetails customer completion'
      })
      .populate('technician', 'name mobile code')
      .populate('recordedBy', 'name')
      .sort({ paidAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      payments,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    res.status(500).json({ message: 'Server error while fetching customer payments' });
  }
};

module.exports = {
  getCustomerPayments
};

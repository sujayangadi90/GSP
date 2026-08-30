const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Appliance = require('../models/Appliance');
const Brand = require('../models/Brand');
const FollowUp = require('../models/FollowUp');
const Customer = require('../models/Customer');
const InventoryItem = require('../models/InventoryItem');
const Amc = require('../models/Amc');
const { sendPushNotification } = require('../utils/notification');

// @desc    Create a new request (Installation or Service)
// @route   POST /api/tickets
// @access  Private/Dealer
const createTicket = async (req, res) => {
  // Parse nested fields from multipart/form-data if they exist as flat keys (e.g. customer[name])
  for (const key in req.body) {
    if (key.includes('[') && key.endsWith(']')) {
      const parts = key.split('[');
      const parentKey = parts[0];
      const childKey = parts[1].slice(0, -1);
      if (!req.body[parentKey]) {
        req.body[parentKey] = {};
      }
      req.body[parentKey][childKey] = req.body[key];
    }
  }

  const {
    type,
    customer,
    product,
    serviceDetails,
    installationDetails,
    serviceType,
    installationType,
    preferredVisitDate,
    remarks,
    dealer,
    invoiceImage
  } = req.body;

  try {
    let ticketDealer = null;
    let ticketSource = 'dealer';
    if (req.user.role === 'admin') {
      ticketDealer = dealer;
      ticketSource = 'admin';
    } else if (req.user.role === 'technician') {
      ticketDealer = dealer || null;
      ticketSource = 'technician';
    } else {
      ticketDealer = req.user._id;
      ticketSource = 'dealer';
    }

    const finalServiceType = (serviceDetails && serviceDetails.serviceType) || serviceType || 'In Warranty';
    const finalInstallationType = (installationDetails && installationDetails.installationType) || installationType || 'Free Installation';

    const finalServiceDetails = serviceDetails ? {
      ...serviceDetails,
      serviceType: finalServiceType
    } : undefined;

    const finalInstallationDetails = installationDetails ? {
      ...installationDetails,
      installationType: finalInstallationType
    } : undefined;

    const ticket = new Ticket({
      type,
      customer,
      product,
      serviceDetails: finalServiceDetails,
      installationDetails: finalInstallationDetails,
      serviceType: type === 'service' ? finalServiceType : undefined,
      installationType: type === 'installation' ? finalInstallationType : undefined,
      preferredVisitDate,
      remarks,
      dealer: ticketDealer,
      source: ticketSource,
      createdBy: req.user._id,
      status: 'new'
    });

    if (req.file) {
      ticket.invoiceImage = 'uploads/' + req.file.filename;
    } else if (invoiceImage) {
      ticket.invoiceImage = invoiceImage;
    }

    const createdTicket = await ticket.save();
    
    // Sync to Customer collection
    try {
      let applianceId = null;
      if (product && product.category) {
        const foundAppliance = await Appliance.findOne({
          name: { $regex: new RegExp(`^${product.category.trim()}$`, 'i') }
        });
        if (foundAppliance) {
          applianceId = foundAppliance._id;
        }
      }

      let dbCustomer = await Customer.findOne({ mobile: customer.mobile });
      if (!dbCustomer) {
        dbCustomer = new Customer({
          name: customer.name,
          mobile: customer.mobile,
          alternateMobile: customer.alternateMobile || '',
          address: customer.address,
          city: customer.city,
          pincode: customer.pincode,
          appliances: []
        });
      } else {
        dbCustomer.name = customer.name;
        dbCustomer.alternateMobile = customer.alternateMobile || dbCustomer.alternateMobile || '';
        dbCustomer.address = customer.address;
        dbCustomer.city = customer.city;
        dbCustomer.pincode = customer.pincode;
      }

      if (applianceId && !dbCustomer.appliances.includes(applianceId)) {
        dbCustomer.appliances.push(applianceId);
      }

      await dbCustomer.save();
    } catch (err) {
      console.error('Failed to sync customer details:', err);
    }

    res.status(201).json(createdTicket);

    // Trigger Notification
    sendPushNotification(
      createdTicket.dealer,
      'Ticket Submitted',
      `Your ticket for ${createdTicket.product.category} (${createdTicket.ticketNumber}) has been created successfully.`,
      { screen: 'ticket_details', ticketId: createdTicket._id }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const attachFeesToTickets = async (tickets) => {
  const brandsList = await Brand.find().populate('appliance');
  const brandMap = {};
  brandsList.forEach(b => {
    const appName = b.appliance ? b.appliance.name.trim().toLowerCase() : '';
    const bName = b.name.trim().toLowerCase();
    brandMap[`${appName}_${bName}`] = b;
  });

  return tickets.map(t => {
    const ticketObj = t.toObject();
    const appName = t.product.category ? t.product.category.trim().toLowerCase() : '';
    const bName = t.product.name ? t.product.name.trim().toLowerCase() : '';
    const brandObj = brandMap[`${appName}_${bName}`];
    if (brandObj) {
      ticketObj.customerServiceFee = brandObj.customerServiceFee !== undefined ? brandObj.customerServiceFee : (brandObj.serviceFee || 0);
      ticketObj.customerInstallationFee = brandObj.customerInstallationFee !== undefined ? brandObj.customerInstallationFee : (brandObj.installationFee || 0);
      ticketObj.dealerServiceFee = brandObj.dealerServiceFee !== undefined ? brandObj.dealerServiceFee : (brandObj.serviceFee || 0);
      ticketObj.dealerInstallationFee = brandObj.dealerInstallationFee !== undefined ? brandObj.dealerInstallationFee : (brandObj.installationFee || 0);
      ticketObj.technicianServiceFee = brandObj.technicianServiceFee !== undefined ? brandObj.technicianServiceFee : (brandObj.serviceFee || 0);
      ticketObj.technicianInstallationFee = brandObj.technicianInstallationFee !== undefined ? brandObj.technicianInstallationFee : (brandObj.installationFee || 0);

      ticketObj.serviceFee = ticketObj.customerServiceFee;
      ticketObj.installationFee = ticketObj.customerInstallationFee;

      ticketObj.technicianFee = ticketObj.type === 'installation' ? ticketObj.technicianInstallationFee : ticketObj.technicianServiceFee;
      ticketObj.dealerFee = ticketObj.type === 'installation' ? ticketObj.dealerInstallationFee : ticketObj.dealerServiceFee;
      ticketObj.customerFee = ticketObj.type === 'installation' ? ticketObj.customerInstallationFee : ticketObj.customerServiceFee;
    } else {
      ticketObj.serviceFee = 0;
      ticketObj.installationFee = 0;
      ticketObj.technicianFee = 0;
      ticketObj.dealerFee = 0;
      ticketObj.customerFee = 0;
    }

    const sType = ticketObj.serviceType || (ticketObj.serviceDetails && ticketObj.serviceDetails.serviceType) || 'In Warranty';
    const iType = ticketObj.installationType || (ticketObj.installationDetails && ticketObj.installationDetails.installationType) || 'Free Installation';
    ticketObj.serviceType = sType;
    ticketObj.installationType = iType;

    const isPaidByDealer = (ticketObj.type === 'service' && sType === 'Paid by Dealer') || (ticketObj.type === 'installation' && iType === 'Paid by Dealer');

    if (ticketObj.status === 'completed' || ticketObj.status === 'closed') {
      if (!isPaidByDealer) {
        ticketObj.dealerExpense = 0;
      } else {
        if (ticketObj.dealerExpense !== undefined && ticketObj.dealerExpense !== null && typeof ticketObj.dealerExpense === 'number' && ticketObj.dealerExpense > 0) {
          // Use historical snapshot
        } else {
          if (brandObj) {
            if (ticketObj.type === 'service') {
              ticketObj.dealerExpense = brandObj.dealerServiceFee !== undefined ? brandObj.dealerServiceFee : (brandObj.serviceFee !== undefined ? brandObj.serviceFee : 'Fee Not Configured');
            } else if (ticketObj.type === 'installation') {
              ticketObj.dealerExpense = brandObj.dealerInstallationFee !== undefined ? brandObj.dealerInstallationFee : (brandObj.installationFee !== undefined ? brandObj.installationFee : 'Fee Not Configured');
            } else {
              ticketObj.dealerExpense = 'Fee Not Configured';
            }
          } else {
            ticketObj.dealerExpense = 'Fee Not Configured';
          }
        }
      }

      if (ticketObj.technicianEarning !== undefined && ticketObj.technicianEarning !== null && typeof ticketObj.technicianEarning === 'number') {
        // Use historical snapshot
      } else {
        if (brandObj) {
          if (ticketObj.type === 'service') {
            ticketObj.technicianEarning = brandObj.technicianServiceFee !== undefined ? brandObj.technicianServiceFee : (brandObj.serviceFee !== undefined ? brandObj.serviceFee : 'Fee Not Configured');
          } else if (ticketObj.type === 'installation') {
            ticketObj.technicianEarning = brandObj.technicianInstallationFee !== undefined ? brandObj.technicianInstallationFee : (brandObj.installationFee !== undefined ? brandObj.installationFee : 'Fee Not Configured');
          } else {
            ticketObj.technicianEarning = 'Fee Not Configured';
          }
        } else {
          ticketObj.technicianEarning = 'Fee Not Configured';
        }
      }
    } else {
      ticketObj.dealerExpense = 0;
      ticketObj.technicianEarning = 0;
    }

    return ticketObj;
  });
};

// @desc    Get all tickets with filters
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
  try {
    const { status, type, dealer, technician, city, search, customerMobile, fromDate, toDate, performanceFilter, month, year, page, limit, dashboardFilter } = req.query;
    let query = {};

    // For dealers, restrict to their own tickets
    if (req.user.role === 'dealer') {
      query.dealer = req.user._id;
    }
    // For technicians, restrict to their assigned tickets
    else if (req.user.role === 'technician') {
      query.assignedTechnician = req.user._id;
    }

    // Dashboard specific filters for admin
    if (dashboardFilter === 'true' && req.user.role === 'admin' && fromDate && toDate) {
      const start = new Date(`${fromDate}T00:00:00`);
      const end = new Date(`${toDate}T23:59:59.999`);

      if (status === 'new') {
        query.status = 'new';
        query.createdAt = { $gte: start, $lte: end };
      } else if (status === 'assigned') {
        query.status = { $ne: 'new' };
        query.timeline = {
          $elemMatch: {
            status: 'assigned',
            timestamp: { $gte: start, $lte: end }
          }
        };
      } else if (status === 'closed') {
        query.status = 'closed';
        query.closedAt = { $gte: start, $lte: end };
      } else if (status === 'pending') {
        query.status = { $in: ['in_progress', 'verification_pending', 'completed'] };
      } else {
        // total/all
        query.createdAt = { $gte: start, $lte: end };
      }

      if (city) query['customer.city'] = { $regex: city, $options: 'i' };
      if (type) query.type = type;
      if (search) {
        query.$or = [
          { ticketNumber: { $regex: search, $options: 'i' } },
          { 'customer.name': { $regex: search, $options: 'i' } },
          { 'customer.mobile': { $regex: search, $options: 'i' } },
          { 'product.name': { $regex: search, $options: 'i' } }
        ];
      }

      if (status === 'pending') {
        let tickets = await Ticket.find(query)
          .populate('dealer', 'name code email mobile')
          .populate('assignedTechnician', 'name code mobile')
          .populate('createdBy', 'name code email mobile role')
          .populate('completion.usedParts.part', 'name sku sellingPrice')
          .populate('completionHistory.usedParts.part', 'name sku sellingPrice')
          .sort({ createdAt: -1 });

        // filter in memory
        tickets = tickets.filter(ticket => {
          const currentStatusTimeline = [...ticket.timeline]
            .reverse()
            .find(item => item.status === ticket.status);
          if (currentStatusTimeline) {
            const ts = new Date(currentStatusTimeline.timestamp);
            return ts >= start && ts <= end;
          }
          return ticket.updatedAt >= start && ticket.updatedAt <= end;
        });

        return res.json(tickets);
      }
    } else if (status) {
      if (req.user.role === 'dealer') {
        if (status === 'all') {
          // fetch all
        } else if (status === 'open') {
          query.status = { $in: ['new', 'assigned', 'in_progress'] };
        } else if (status === 'completed') {
          query.status = { $in: ['completed', 'verification_pending'] };
        } else {
          query.status = status;
        }
      } else if (req.user.role === 'technician') {
        if (status === 'assigned') {
          query.status = 'assigned';
        } else if (status === 'in_progress') {
          query.status = 'in_progress';
        } else if (status === 'closed') {
          query.status = { $in: ['completed', 'closed'] };
        } else {
          query.status = status;
        }
      } else {
        query.status = status;
      }
    }
    if (type) query.type = type;
    if (customerMobile) query['customer.mobile'] = customerMobile;
    if (dealer && req.user.role === 'admin') {
      query.dealer = dealer;

      if (req.query.dealerFilter) {
        const start = new Date(`${fromDate}T00:00:00`);
        const end = new Date(`${toDate}T23:59:59.999`);

        const dealerTicketsQuery = {
          dealer,
          $or: [
            {
              status: { $in: ['completed', 'closed'] },
              $or: [
                { 'adminVerification.verifiedAt': { $gte: start, $lte: end } },
                { 'adminVerification.verifiedAt': { $exists: false }, updatedAt: { $gte: start, $lte: end } },
                { closedAt: { $gte: start, $lte: end } }
              ]
            },
            {
              status: { $nin: ['completed', 'closed'] },
              createdAt: { $gte: start, $lte: end }
            }
          ]
        };

        const tickets = await Ticket.find(dealerTicketsQuery)
          .populate('dealer', 'name code email mobile')
          .populate('assignedTechnician', 'name code mobile')
          .populate('createdBy', 'name code email mobile role')
          .populate('completion.usedParts.part', 'name sku sellingPrice')
          .populate('completionHistory.usedParts.part', 'name sku sellingPrice')
          .sort({ createdAt: -1 });

        const ticketsWithFees = await attachFeesToTickets(tickets);

        const totalCount = await Ticket.countDocuments(dealerTicketsQuery);

        const completedCount = await Ticket.countDocuments({
          dealer,
          status: { $in: ['completed', 'closed'] },
          $or: [
            { 'adminVerification.verifiedAt': { $gte: start, $lte: end } },
            { 'adminVerification.verifiedAt': { $exists: false }, updatedAt: { $gte: start, $lte: end } },
            { closedAt: { $gte: start, $lte: end } }
          ]
        });

        const inProgressCount = await Ticket.countDocuments({
          dealer,
          status: { $in: ['assigned', 'in_progress'] },
          createdAt: { $gte: start, $lte: end }
        });

        const pendingVerificationCount = await Ticket.countDocuments({
          dealer,
          status: 'verification_pending',
          createdAt: { $gte: start, $lte: end }
        });

        let totalExpenses = 0;
        ticketsWithFees.forEach(t => {
          if (t.status === 'completed' || t.status === 'closed') {
            if (typeof t.dealerExpense === 'number') {
              totalExpenses += t.dealerExpense;
            }
          }
        });

        return res.json({
          tickets: ticketsWithFees,
          summary: {
            total: totalCount,
            completed: completedCount,
            inProgress: inProgressCount,
            pendingVerification: pendingVerificationCount,
            expenses: totalExpenses
          }
        });
      }
    }
    
    // Technician performance detail tickets
    if (technician && performanceFilter && fromDate && toDate) {
      const start = new Date(`${fromDate}T00:00:00`);
      const end = new Date(`${toDate}T23:59:59.999`);

      if (performanceFilter === 'rejected') {
        const historyTickets = await Ticket.find({
          'timeline.status': 'assigned',
          'timeline.note': { $regex: 'rejected', $options: 'i' }
        })
          .populate('dealer', 'name code email mobile')
          .populate('assignedTechnician', 'name code mobile')
          .populate('createdBy', 'name code email mobile role')
          .populate('completion.usedParts.part', 'name sku sellingPrice')
          .populate('completionHistory.usedParts.part', 'name sku sellingPrice')
          .sort({ createdAt: -1 });

        const filtered = historyTickets.filter(t => {
          return t.timeline.some(item => {
            const isMatch = item.note && item.note.toLowerCase().includes('rejected');
            const inRange = new Date(item.timestamp) >= start && new Date(item.timestamp) <= end;
            return isMatch && inRange;
          });
        });

        const ticketsWithFees = await attachFeesToTickets(filtered);
        return res.json(ticketsWithFees);
      } else {
        query.assignedTechnician = technician;
        if (performanceFilter === 'assigned') {
          query.timeline = {
            $elemMatch: {
              status: 'assigned',
              timestamp: { $gte: start, $lte: end }
            }
          };
        } else if (performanceFilter === 'completed') {
          query.status = { $in: ['completed', 'closed'] };
          query['completion.submittedAt'] = { $gte: start, $lte: end };
        } else {
          // assigned_completed
          query.$or = [
            { timeline: { $elemMatch: { status: 'assigned', timestamp: { $gte: start, $lte: end } } } },
            { status: { $in: ['completed', 'closed'] }, 'completion.submittedAt': { $gte: start, $lte: end } }
          ];
        }

        const tickets = await Ticket.find(query)
          .populate('dealer', 'name code email mobile')
          .populate('assignedTechnician', 'name code mobile')
          .populate('createdBy', 'name code email mobile role')
          .populate('completion.usedParts.part', 'name sku sellingPrice')
          .populate('completionHistory.usedParts.part', 'name sku sellingPrice')
          .sort({ createdAt: -1 });

        const totalCount = await Ticket.countDocuments({
          assignedTechnician: technician,
          timeline: { $elemMatch: { status: 'assigned', timestamp: { $gte: start, $lte: end } } }
        });

        const completedCount = await Ticket.countDocuments({
          assignedTechnician: technician,
          status: { $in: ['completed', 'closed'] },
          'completion.submittedAt': { $gte: start, $lte: end }
        });

        const inProgressCount = await Ticket.countDocuments({
          assignedTechnician: technician,
          status: { $in: ['assigned', 'in_progress'] },
          timeline: { $elemMatch: { status: 'assigned', timestamp: { $gte: start, $lte: end } } }
        });

        const pendingVerificationCount = await Ticket.countDocuments({
          assignedTechnician: technician,
          status: 'verification_pending',
          'completion.submittedAt': { $gte: start, $lte: end }
        });

        const completedTicketsForEarnings = await Ticket.find({
          assignedTechnician: technician,
          status: { $in: ['completed', 'closed'] },
          'completion.submittedAt': { $gte: start, $lte: end }
        });

        const completedTicketsWithFees = await attachFeesToTickets(completedTicketsForEarnings);
        let earnings = 0;
        completedTicketsWithFees.forEach(t => {
          if (typeof t.technicianEarning === 'number') {
            earnings += t.technicianEarning;
          }
        });

        return res.json({
          tickets,
          summary: {
            total: totalCount,
            completed: completedCount,
            inProgress: inProgressCount,
            pendingVerification: pendingVerificationCount,
            earnings: earnings
          }
        });
      }
    }

    if (city) query['customer.city'] = { $regex: city, $options: 'i' };

    if (fromDate && toDate && !performanceFilter && dashboardFilter !== 'true') {
      const start = new Date(fromDate);
      start.setUTCHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setUTCHours(23, 59, 59, 999);

      if (req.user && req.user.role === 'dealer') {
        query.$or = [
          {
            status: { $in: ['completed', 'closed'] },
            $or: [
              { 'adminVerification.verifiedAt': { $gte: start, $lte: end } },
              { 'adminVerification.verifiedAt': { $exists: false }, updatedAt: { $gte: start, $lte: end } },
              { closedAt: { $gte: start, $lte: end } }
            ]
          },
          {
            status: { $nin: ['completed', 'closed'] },
            createdAt: { $gte: start, $lte: end }
          }
        ];
      } else {
        query.createdAt = { $gte: start, $lte: end };
      }
    }

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.mobile': { $regex: search, $options: 'i' } },
        { 'product.name': { $regex: search, $options: 'i' } }
      ];
    }

    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    if (page) {
      const p = parseInt(page, 10) || 1;
      const l = parseInt(limit, 10) || 10;
      const skip = (p - 1) * l;

      const total = await Ticket.countDocuments(query);
      const tickets = await Ticket.find(query)
        .populate('dealer', 'name code email mobile')
        .populate('assignedTechnician', 'name code mobile')
        .populate('createdBy', 'name code email mobile role')
        .populate('completion.usedParts.part', 'name sku sellingPrice')
        .populate('completionHistory.usedParts.part', 'name sku sellingPrice')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l);

      const ticketsWithFees = await attachFeesToTickets(tickets);

      return res.json({
        data: ticketsWithFees,
        page: p,
        limit: l,
        hasMore: (skip + tickets.length) < total
      });
    }

    const tickets = await Ticket.find(query)
      .populate('dealer', 'name code email mobile')
      .populate('assignedTechnician', 'name code mobile')
      .populate('createdBy', 'name code email mobile role')
      .populate('completion.usedParts.part', 'name sku sellingPrice')
      .populate('completionHistory.usedParts.part', 'name sku sellingPrice')
      .sort({ createdAt: -1 });

    const ticketsWithFees = await attachFeesToTickets(tickets);

    res.json(ticketsWithFees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single ticket details
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('dealer', 'name code email mobile contactPerson address city')
      .populate('assignedTechnician', 'name code mobile email')
      .populate('createdBy', 'name code email mobile role')
      .populate('completion.usedParts.part', 'name sku sellingPrice')
      .populate('completionHistory.usedParts.part', 'name sku sellingPrice');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Authorization checks
    if (req.user.role === 'dealer' && (!ticket.dealer || ticket.dealer._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }
    if (req.user.role === 'technician') {
      const isAssigned = ticket.assignedTechnician && ticket.assignedTechnician._id.toString() === req.user._id.toString();
      const isCreator = ticket.createdBy && ticket.createdBy.toString() === req.user._id.toString();
      if (!isAssigned && !isCreator) {
        return res.status(403).json({ message: 'Not authorized to view this ticket' });
      }
    }

    const ticketObj = ticket.toObject();
    const appName = ticket.product.category ? ticket.product.category.trim().toLowerCase() : '';
    const bName = ticket.product.name ? ticket.product.name.trim().toLowerCase() : '';
    const brandObj = await Brand.findOne({
      name: { $regex: new RegExp(`^${bName}$`, 'i') }
    }).populate({
      path: 'appliance',
      match: { name: { $regex: new RegExp(`^${appName}$`, 'i') } }
    });
    if (brandObj && brandObj.appliance) {
      ticketObj.customerServiceFee = brandObj.customerServiceFee !== undefined ? brandObj.customerServiceFee : (brandObj.serviceFee || 0);
      ticketObj.customerInstallationFee = brandObj.customerInstallationFee !== undefined ? brandObj.customerInstallationFee : (brandObj.installationFee || 0);
      ticketObj.dealerServiceFee = brandObj.dealerServiceFee !== undefined ? brandObj.dealerServiceFee : (brandObj.serviceFee || 0);
      ticketObj.dealerInstallationFee = brandObj.dealerInstallationFee !== undefined ? brandObj.dealerInstallationFee : (brandObj.installationFee || 0);
      ticketObj.technicianServiceFee = brandObj.technicianServiceFee !== undefined ? brandObj.technicianServiceFee : (brandObj.serviceFee || 0);
      ticketObj.technicianInstallationFee = brandObj.technicianInstallationFee !== undefined ? brandObj.technicianInstallationFee : (brandObj.installationFee || 0);

      ticketObj.serviceFee = ticketObj.customerServiceFee;
      ticketObj.installationFee = ticketObj.customerInstallationFee;

      ticketObj.technicianFee = ticketObj.type === 'installation' ? ticketObj.technicianInstallationFee : ticketObj.technicianServiceFee;
      ticketObj.dealerFee = ticketObj.type === 'installation' ? ticketObj.dealerInstallationFee : ticketObj.dealerServiceFee;
      ticketObj.customerFee = ticketObj.type === 'installation' ? ticketObj.customerInstallationFee : ticketObj.customerServiceFee;
    } else {
      ticketObj.serviceFee = 0;
      ticketObj.installationFee = 0;
      ticketObj.technicianFee = 0;
      ticketObj.dealerFee = 0;
      ticketObj.customerFee = 0;
    }

    const sType = ticketObj.serviceType || (ticketObj.serviceDetails && ticketObj.serviceDetails.serviceType) || 'In Warranty';
    const iType = ticketObj.installationType || (ticketObj.installationDetails && ticketObj.installationDetails.installationType) || 'Free Installation';
    ticketObj.serviceType = sType;
    ticketObj.installationType = iType;

    const isPaidByDealer = (ticketObj.type === 'service' && sType === 'Paid by Dealer') || (ticketObj.type === 'installation' && iType === 'Paid by Dealer');

    if (ticketObj.status === 'completed' || ticketObj.status === 'closed') {
      if (!isPaidByDealer) {
        ticketObj.dealerExpense = 0;
      } else {
        if (ticketObj.dealerExpense !== undefined && ticketObj.dealerExpense !== null && typeof ticketObj.dealerExpense === 'number' && ticketObj.dealerExpense > 0) {
          // Use snapshot
        } else {
          if (brandObj && brandObj.appliance) {
            if (ticketObj.type === 'service') {
              ticketObj.dealerExpense = brandObj.dealerServiceFee !== undefined ? brandObj.dealerServiceFee : (brandObj.serviceFee !== undefined ? brandObj.serviceFee : 'Fee Not Configured');
            } else if (ticketObj.type === 'installation') {
              ticketObj.dealerExpense = brandObj.dealerInstallationFee !== undefined ? brandObj.dealerInstallationFee : (brandObj.installationFee !== undefined ? brandObj.installationFee : 'Fee Not Configured');
            } else {
              ticketObj.dealerExpense = 'Fee Not Configured';
            }
          } else {
            ticketObj.dealerExpense = 'Fee Not Configured';
          }
        }
      }

      if (ticketObj.technicianEarning !== undefined && ticketObj.technicianEarning !== null && typeof ticketObj.technicianEarning === 'number') {
        // Use snapshot
      } else {
        if (brandObj && brandObj.appliance) {
          if (ticketObj.type === 'service') {
            ticketObj.technicianEarning = brandObj.technicianServiceFee !== undefined ? brandObj.technicianServiceFee : (brandObj.serviceFee !== undefined ? brandObj.serviceFee : 'Fee Not Configured');
          } else if (ticketObj.type === 'installation') {
            ticketObj.technicianEarning = brandObj.technicianInstallationFee !== undefined ? brandObj.technicianInstallationFee : (brandObj.installationFee !== undefined ? brandObj.installationFee : 'Fee Not Configured');
          } else {
            ticketObj.technicianEarning = 'Fee Not Configured';
          }
        } else {
          ticketObj.technicianEarning = 'Fee Not Configured';
        }
      }
    } else {
      ticketObj.dealerExpense = 0;
      ticketObj.technicianEarning = 0;
    }

    res.json(ticketObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign or reassign a technician
// @route   PATCH /api/tickets/:id/assign
// @access  Private/Admin
const assignTechnician = async (req, res) => {
  const { technicianId, assignmentNotes } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const technician = await User.findById(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res.status(400).json({ message: 'Invalid technician' });
    }

    ticket.assignedTechnician = technicianId;
    ticket.assignmentNotes = assignmentNotes;
    ticket.status = 'assigned';

    ticket.timeline.push({
      status: 'assigned',
      note: `Assigned to technician ${technician.name}. Note: ${assignmentNotes || 'None'}`,
      updatedBy: req.user.name
    });

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);

    // Trigger Notifications
    // 1. To Dealer
    sendPushNotification(
      updatedTicket.dealer,
      'Technician Assigned',
      `${technician.name} has been assigned to ticket #${updatedTicket.ticketNumber}. Scheduled arrival: ${updatedTicket.preferredVisitDate ? new Date(updatedTicket.preferredVisitDate).toLocaleString() : 'Flexible'}.`,
      { screen: 'ticket_details', ticketId: updatedTicket._id }
    );

    // 2. To Technician
    sendPushNotification(
      updatedTicket.assignedTechnician,
      'New Job Assigned',
      `You have been assigned to #${updatedTicket.ticketNumber} for ${updatedTicket.product.category}`,
      { screen: 'job_details', jobId: updatedTicket._id }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Technician updates status
// @route   PATCH /api/tickets/:id/status
// @access  Private/Technician
const updateTicketStatus = async (req, res) => {
  const { status, note } = req.body; // status should be 'in_progress', etc.

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (!ticket.assignedTechnician || ticket.assignedTechnician.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    ticket.status = status;
    ticket.timeline.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.user.name
    });

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);

    // Trigger Notification
    if (status === 'in_progress') {
      sendPushNotification(
        updatedTicket.dealer,
        'Service In Progress',
        `${req.user.name} has started working on your ticket #${updatedTicket.ticketNumber}.`,
        { screen: 'ticket_details', ticketId: updatedTicket._id }
      );
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Technician submits work completion
// @route   PATCH /api/tickets/:id/complete
// @access  Private/Technician
const submitWorkCompletion = async (req, res) => {
  const { workDone, remarks, usedParts } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (!ticket.assignedTechnician || ticket.assignedTechnician.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this ticket' });
    }

    let beforePhotos = [];
    let afterPhotos = [];
    let completionPhotos = [];

    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach(file => {
          completionPhotos.push('uploads/' + file.filename);
        });
      } else {
        if (req.files.beforePhotos) {
          req.files.beforePhotos.forEach(file => {
            beforePhotos.push('uploads/' + file.filename);
          });
        }
        if (req.files.afterPhotos) {
          req.files.afterPhotos.forEach(file => {
            afterPhotos.push('uploads/' + file.filename);
          });
        }
        if (req.files.photos) {
          req.files.photos.forEach(file => {
            completionPhotos.push('uploads/' + file.filename);
          });
        }
      }
    }

    // Fallback/Legacy preservation
    if (completionPhotos.length === 0 && (beforePhotos.length > 0 || afterPhotos.length > 0)) {
      completionPhotos = [...beforePhotos, ...afterPhotos];
    } else if (completionPhotos.length === 0 && ticket.completion && ticket.completion.photos) {
      completionPhotos = ticket.completion.photos;
      beforePhotos = ticket.completion.beforePhotos || [];
      afterPhotos = ticket.completion.afterPhotos || [];
    }

    if (completionPhotos.length === 0 && beforePhotos.length === 0 && afterPhotos.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one completion photo' });
    }

    let parsedUsedParts = [];
    if (usedParts) {
      try {
        parsedUsedParts = typeof usedParts === 'string' ? JSON.parse(usedParts) : usedParts;
      } catch (err) {
        console.error('Failed to parse usedParts:', err);
      }
    }

    // Validate inventory stock
    for (const up of parsedUsedParts) {
      const item = await InventoryItem.findById(up.part);
      if (!item) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
      if (item.quantity < Number(up.quantity)) {
        return res.status(400).json({ message: `Insufficient stock for item "${item.name}". Available: ${item.quantity}` });
      }
    }

    // Deduct inventory stock and record transactions
    for (const up of parsedUsedParts) {
      const item = await InventoryItem.findById(up.part);
      item.quantity -= Number(up.quantity);
      item.transactions.push({
        type: 'ticket_use',
        quantity: Number(up.quantity),
        user: req.user.name,
        ticketNumber: ticket.ticketNumber,
        technician: req.user.role === 'technician' ? req.user._id : (ticket.technician || null),
        technicianName: req.user.role === 'technician' ? req.user.name : ''
      });
      await item.save();
    }

    const newCompletion = {
      photos: completionPhotos,
      beforePhotos: beforePhotos,
      afterPhotos: afterPhotos,
      workDone,
      remarks,
      submittedAt: Date.now(),
      usedParts: parsedUsedParts
    };

    ticket.status = 'verification_pending';
    ticket.completion = newCompletion;

    if (!ticket.completionHistory) {
      ticket.completionHistory = [];
    }
    ticket.completionHistory.push(newCompletion);

    ticket.timeline.push({
      status: 'verification_pending',
      note: `Work marked completed by technician. Remarks: ${remarks || 'None'}`,
      updatedBy: req.user.name
    });

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);

    // Trigger Notification
    sendPushNotification(
      updatedTicket.dealer,
      'Pending Your Approval',
      `Technician ${req.user.name} has completed the service for #${updatedTicket.ticketNumber}. Approval Pending from Admin`,
      { screen: 'ticket_details', ticketId: updatedTicket._id }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin verifies completed work (approve/reject)
// @route   PATCH /api/tickets/:id/verify
// @access  Private/Admin
const verifyWork = async (req, res) => {
  const { approvalStatus, reason } = req.body; // approvalStatus: 'approved' or 'rejected'

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.status !== 'verification_pending') {
      return res.status(400).json({ message: 'Ticket is not pending verification' });
    }

    if (approvalStatus === 'approved') {
      ticket.status = 'completed'; // or directly 'closed'
      ticket.adminVerification = {
        status: 'approved',
        reason,
        verifiedAt: Date.now()
      };

      // Snapshot the fee amount
      try {
        const appName = ticket.product.category ? ticket.product.category.trim().toLowerCase() : '';
        const bName = ticket.product.name ? ticket.product.name.trim().toLowerCase() : '';
        const brandObj = await Brand.findOne({
          name: { $regex: new RegExp(`^${bName}$`, 'i') }
        }).populate({
          path: 'appliance',
          match: { name: { $regex: new RegExp(`^${appName}$`, 'i') } }
        });
        if (brandObj && brandObj.appliance) {
          const sType = ticket.serviceType || (ticket.serviceDetails && ticket.serviceDetails.serviceType) || 'In Warranty';
          const iType = ticket.installationType || (ticket.installationDetails && ticket.installationDetails.installationType) || 'Free Installation';
          const isPaidByDealer = (ticket.type === 'service' && sType === 'Paid by Dealer') || (ticket.type === 'installation' && iType === 'Paid by Dealer');

          if (ticket.type === 'service') {
            ticket.dealerExpense = isPaidByDealer 
              ? (brandObj.dealerServiceFee !== undefined ? brandObj.dealerServiceFee : (brandObj.serviceFee !== undefined ? brandObj.serviceFee : null))
              : 0;
            ticket.technicianEarning = brandObj.technicianServiceFee !== undefined ? brandObj.technicianServiceFee : (brandObj.serviceFee !== undefined ? brandObj.serviceFee : null);
          } else if (ticket.type === 'installation') {
            ticket.dealerExpense = isPaidByDealer
              ? (brandObj.dealerInstallationFee !== undefined ? brandObj.dealerInstallationFee : (brandObj.installationFee !== undefined ? brandObj.installationFee : null))
              : 0;
            ticket.technicianEarning = brandObj.technicianInstallationFee !== undefined ? brandObj.technicianInstallationFee : (brandObj.installationFee !== undefined ? brandObj.installationFee : null);
          }
        } else {
          ticket.dealerExpense = 0;
          ticket.technicianEarning = null;
        }
      } catch (err) {
        console.error('Error snapshotting fee on ticket completion:', err.message);
      }

      ticket.timeline.push({
        status: 'completed',
        note: `Work approved by Admin. ${reason ? `Note: ${reason}` : ''}`,
        updatedBy: req.user.name
      });
    } else {
      ticket.status = 'assigned'; // Reject sends it back to technician
      ticket.adminVerification = {
        status: 'rejected',
        reason,
        verifiedAt: Date.now()
      };
      ticket.timeline.push({
        status: 'assigned',
        note: `Work rejected by Admin. Reason: ${reason || 'No reason provided'}`,
        updatedBy: req.user.name
      });
    }

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);

    // Trigger Notification
    if (approvalStatus === 'rejected') {
      sendPushNotification(
        updatedTicket.assignedTechnician,
        'Action Required: Job Rejected ⚠️',
        `Admin has rejected the completion report for #${updatedTicket.ticketNumber}.`,
        { screen: 'job_details', jobId: updatedTicket._id }
      );
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin closes ticket
// @route   PATCH /api/tickets/:id/close
// @access  Private/Admin
const closeTicket = async (req, res) => {
  const { closingRemarks } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = 'closed';
    ticket.closingRemarks = closingRemarks;
    ticket.closedAt = Date.now();

    ticket.timeline.push({
      status: 'closed',
      note: `Ticket closed. Remarks: ${closingRemarks || 'None'}`,
      updatedBy: req.user.name
    });

    const updatedTicket = await ticket.save();

    // Auto-generate follow-up record
    try {
      const applianceName = ticket.product.category || '';
      const brandName = ticket.product.name || '';

      const appliance = await Appliance.findOne({ name: { $regex: new RegExp(`^${applianceName.trim()}$`, 'i') } });
      let followUpDays = 90; // Default if not found

      if (appliance) {
        const brand = await Brand.findOne({
          appliance: appliance._id,
          name: { $regex: new RegExp(`^${brandName.trim()}$`, 'i') }
        });
        if (brand) {
          followUpDays = brand.followUpDays;
        }
      }

      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + followUpDays);

      await FollowUp.create({
        ticket: ticket._id,
        dueAt,
        status: 'new'
      });
    } catch (followUpError) {
      console.error('Failed to auto-create follow-up:', followUpError.message);
    }

    // Trigger Notifications
    // 1. To Dealer
    sendPushNotification(
      updatedTicket.dealer,
      'Ticket Closed Successfully',
      `Ticket #${updatedTicket.ticketNumber} is now closed. Thank you for using GSP!`,
      { screen: 'ticket_details', ticketId: updatedTicket._id }
    );

    // 2. To Technician
    sendPushNotification(
      updatedTicket.assignedTechnician,
      'Job Closed Successfully',
      `Great job! Job #${updatedTicket.ticketNumber} has been verified and successfully closed by the admin.`,
      { screen: 'job_history', jobId: updatedTicket._id }
    );

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin cancels ticket
// @route   PATCH /api/tickets/:id/cancel
// @access  Private/Admin
const cancelTicket = async (req, res) => {
  const { reason } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = 'cancelled';
    ticket.timeline.push({
      status: 'cancelled',
      note: `Ticket cancelled by Admin. Reason: ${reason || 'None'}`,
      updatedBy: req.user.name
    });

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);

    // Trigger Notifications
    // 1. To Dealer
    sendPushNotification(
      updatedTicket.dealer,
      'Ticket Cancelled',
      `Ticket #${updatedTicket.ticketNumber} has been cancelled.`,
      { screen: 'ticket_details', ticketId: updatedTicket._id }
    );

    // 2. To Technician (if one is assigned)
    if (updatedTicket.assignedTechnician) {
      sendPushNotification(
        updatedTicket.assignedTechnician,
        'Job Cancelled',
        `Job #${updatedTicket.ticketNumber} has been cancelled`,
        { screen: 'dashboard' }
      );
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all unique customers
// @route   GET /api/tickets/customers
// @access  Private/Admin
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().populate('appliances', 'name').sort({ name: 1 }).lean();
    
    // Supplement with lastTicketDate and ticketCount
    const ticketsGrouped = await Ticket.aggregate([
      {
        $group: {
          _id: "$customer.mobile",
          lastTicketDate: { $max: "$createdAt" },
          ticketCount: { $sum: 1 }
        }
      }
    ]);
    
    const ticketStatsMap = {};
    ticketsGrouped.forEach(item => {
      ticketStatsMap[item._id] = item;
    });
    
    const result = customers.map(cust => ({
      ...cust,
      lastTicketDate: ticketStatsMap[cust.mobile]?.lastTicketDate || null,
      ticketCount: ticketStatsMap[cust.mobile]?.ticketCount || 0
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new customer
// @route   POST /api/tickets/customers
// @access  Private/Admin
const addCustomer = async (req, res) => {
  const { name, mobile, alternateMobile, address, city, pincode, appliances } = req.body;

  try {
    const customerExists = await Customer.findOne({ mobile });
    if (customerExists) {
      return res.status(400).json({ message: 'Customer with this mobile number already registered' });
    }

    const customer = await Customer.create({
      name,
      mobile,
      alternateMobile: alternateMobile || '',
      address,
      city,
      pincode,
      appliances: appliances || []
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update customer details
// @route   PUT /api/tickets/customers/:id
// @access  Private/Admin
const updateCustomer = async (req, res) => {
  const { name, mobile, alternateMobile, address, city, pincode, appliances } = req.body;
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (mobile && mobile !== customer.mobile) {
      const exists = await Customer.findOne({ mobile });
      if (exists) {
        return res.status(400).json({ message: 'Mobile number already registered to another customer' });
      }
    }

    customer.name = name || customer.name;
    customer.mobile = mobile || customer.mobile;
    customer.alternateMobile = alternateMobile !== undefined ? alternateMobile : customer.alternateMobile;
    customer.address = address || customer.address;
    customer.city = city || customer.city;
    customer.pincode = pincode || customer.pincode;
    customer.appliances = appliances !== undefined ? appliances : customer.appliances;

    const updated = await customer.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard statistics with date filters
// @route   GET /api/tickets/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'fromDate and toDate are required' });
    }

    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T23:59:59.999`);

    // Total Requests: tickets created within [start, end]
    const totalCount = await Ticket.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // New Requests: tickets created within [start, end] with status 'new'
    const newCount = await Ticket.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: 'new'
    });

    // Assigned Requests: assignment date within [start, end] and status !== 'new'
    const assignedCount = await Ticket.countDocuments({
      status: { $ne: 'new' },
      timeline: {
        $elemMatch: {
          status: 'assigned',
          timestamp: { $gte: start, $lte: end }
        }
      }
    });

    // Pending/Action Requests: in_progress, verification_pending, or completed
    // whose status entry timestamp (or updatedAt fallback) is in the date range
    const pendingTickets = await Ticket.find({
      status: { $in: ['in_progress', 'verification_pending', 'completed'] }
    });
    const pendingCount = pendingTickets.filter(ticket => {
      const currentStatusTimeline = [...ticket.timeline]
        .reverse()
        .find(item => item.status === ticket.status);
      if (currentStatusTimeline) {
        const ts = new Date(currentStatusTimeline.timestamp);
        return ts >= start && ts <= end;
      }
      return ticket.updatedAt >= start && ticket.updatedAt <= end;
    }).length;

    // Closed Requests: closedAt in [start, end] and status === 'closed'
    const closedCount = await Ticket.countDocuments({
      status: 'closed',
      closedAt: { $gte: start, $lte: end }
    });

    // Pending Work Verifications: status === 'verification_pending' and verification request date (completion.submittedAt) in [start, end]
    const pendingVerifications = await Ticket.find({
      status: 'verification_pending',
      'completion.submittedAt': { $gte: start, $lte: end }
    })
    .populate('dealer', 'name code email mobile')
    .populate('assignedTechnician', 'name code mobile')
    .sort({ 'completion.submittedAt': -1 });

    // New Unassigned Tickets: status === 'new' and createdAt in [start, end]
    const newUnassignedTickets = await Ticket.find({
      status: 'new',
      createdAt: { $gte: start, $lte: end }
    })
    .populate('dealer', 'name code email mobile')
    .sort({ createdAt: -1 });

    // --- Analytics Aggregations (with individual try/catches for robustness) ---

    // 1. Top 10 Technicians based on tickets closed within [start, end]
    let topTechnicians = [];
    try {
      const topTechniciansRaw = await Ticket.aggregate([
        {
          $match: {
            status: 'closed',
            closedAt: { $gte: start, $lte: end },
            assignedTechnician: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$assignedTechnician',
            closedCount: { $sum: 1 }
          }
        },
        { $sort: { closedCount: -1 } },
        { $limit: 10 }
      ]);

      for (const t of topTechniciansRaw) {
        const userObj = await User.findById(t._id).select('name code mobile');
        topTechnicians.push({
          _id: t._id,
          name: userObj ? userObj.name : 'Unknown Technician',
          code: userObj ? userObj.code : '',
          closedCount: t.closedCount
        });
      }
    } catch (e) {
      console.error('Error calculating topTechnicians:', e.message);
    }

    // 2. Dealer Performance (Top 6 + Others) based on tickets created within [start, end]
    let topDealers = [];
    try {
      const dealerPerfRaw = await Ticket.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            dealer: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$dealer',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const populatedDealers = [];
      for (const d of dealerPerfRaw) {
        const userObj = await User.findById(d._id).select('name code');
        populatedDealers.push({
          name: userObj ? (userObj.name || userObj.code) : 'Unknown Dealer',
          count: d.count
        });
      }

      if (populatedDealers.length > 6) {
        topDealers = populatedDealers.slice(0, 6);
        const othersCount = populatedDealers.slice(6).reduce((acc, d) => acc + d.count, 0);
        topDealers.push({ name: 'Others', count: othersCount });
      } else {
        topDealers = populatedDealers;
      }
    } catch (e) {
      console.error('Error calculating dealerPerformance:', e.message);
    }

    // 3. Appliance Performance (Top 6 + Others) based on tickets created within [start, end]
    let topAppliances = [];
    try {
      const appliancePerfRaw = await Ticket.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            'product.category': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$product.category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const formattedAppliances = appliancePerfRaw
        .filter(a => a._id && a._id.trim() !== '')
        .map(a => ({
          name: a._id.trim(),
          count: a.count
        }));

      if (formattedAppliances.length > 6) {
        topAppliances = formattedAppliances.slice(0, 6);
        const othersCount = formattedAppliances.slice(6).reduce((acc, a) => acc + a.count, 0);
        topAppliances.push({ name: 'Others', count: othersCount });
      } else {
        topAppliances = formattedAppliances;
      }
    } catch (e) {
      console.error('Error calculating appliancePerformance:', e.message);
    }

    // 4. Total Customers in the system (Independent of date range)
    let totalCustomers = 0;
    try {
      totalCustomers = await Customer.countDocuments({});
    } catch (e) {
      console.error('Error counting totalCustomers:', e.message);
    }

    // 5. Total Active AMCs in the system (Independent of date range)
    let totalActiveAmcs = 0;
    try {
      totalActiveAmcs = await Amc.countDocuments({ status: 'active' });
    } catch (e) {
      console.error('Error counting totalActiveAmcs:', e.message);
    }

    // 6. Tickets Graph series (number of tickets over time)
    let ticketsByDate = [];
    try {
      ticketsByDate = await Ticket.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    } catch (e) {
      console.error('Error calculating ticketsByDate:', e.message);
    }

    res.json({
      stats: {
        total: totalCount,
        new: newCount,
        assigned: assignedCount,
        pending: pendingCount,
        closed: closedCount,
        totalCustomers,
        totalActiveAmcs
      },
      topTechnicians,
      dealerPerformance: topDealers,
      appliancePerformance: topAppliances,
      ticketsByDate,
      pendingVerifications,
      newUnassignedTickets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin sends custom message (push notification) to dealer or technician
// @route   POST /api/tickets/:id/message
// @access  Private/Admin
const sendCustomAdminMessage = async (req, res) => {
  const { recipient, title, body } = req.body; // recipient: 'dealer', 'technician', or 'both'

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    const targets = [];
    if ((recipient === 'dealer' || recipient === 'both') && ticket.dealer) {
      targets.push({ id: ticket.dealer, screen: 'dashboard' });
    }
    if ((recipient === 'technician' || recipient === 'both') && ticket.assignedTechnician) {
      targets.push({ id: ticket.assignedTechnician, screen: 'dashboard' });
    }

    if (targets.length === 0) {
      return res.status(400).json({ message: 'No valid recipient found to send notification to' });
    }

    for (const target of targets) {
      await sendPushNotification(
        target.id,
        title,
        body,
        { screen: target.screen }
      );
    }

    ticket.timeline.push({
      status: ticket.status,
      note: `Admin notification sent to ${recipient}: "${title}" - "${body}"`,
      updatedBy: req.user.name
    });
    await ticket.save();

    res.json({ message: 'Custom push notifications sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const { reportType, fromDate, toDate, dealer, technician, ticketType, category, brand, page, limit } = req.query;

    if (!reportType || !fromDate || !toDate) {
      return res.status(400).json({ message: 'reportType, fromDate, and toDate are required' });
    }

    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T23:59:59.999`);

    const query = {
      status: { $in: ['completed', 'closed'] },
      $or: [
        { 'adminVerification.verifiedAt': { $gte: start, $lte: end } },
        { 'adminVerification.verifiedAt': { $exists: false }, updatedAt: { $gte: start, $lte: end } },
        { closedAt: { $gte: start, $lte: end } }
      ]
    };

    if (dealer && dealer !== 'ALL') {
      query.dealer = dealer;
    }

    if (technician && technician !== 'ALL') {
      query.assignedTechnician = technician;
    }

    if (ticketType && ticketType !== 'ALL') {
      query.type = ticketType.toLowerCase();
    }

    if (category && category !== 'ALL') {
      query['product.category'] = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    if (brand && brand !== 'ALL') {
      query['product.name'] = { $regex: new RegExp(`^${brand.trim()}$`, 'i') };
    }

    const allMatchingTickets = await Ticket.find(query)
      .populate('dealer', 'name code')
      .populate('assignedTechnician', 'name');

    const allTicketsWithFees = await attachFeesToTickets(allMatchingTickets);

    let totalAmount = 0;
    let serviceAmount = 0;
    let installationAmount = 0;
    let completedCount = 0;

    allTicketsWithFees.forEach(t => {
      const exp = reportType === 'expense' ? t.dealerExpense : t.technicianEarning;
      if (typeof exp === 'number') {
        totalAmount += exp;
        completedCount++;
        if (t.type === 'service') {
          serviceAmount += exp;
        } else if (t.type === 'installation') {
          installationAmount += exp;
        }
      }
    });

    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 25;
    const skip = (p - 1) * l;

    const paginatedTickets = allTicketsWithFees.slice(skip, skip + l);

    res.json({
      data: paginatedTickets,
      summary: {
        totalAmount,
        completedCount: allMatchingTickets.length,
        serviceAmount,
        installationAmount
      },
      page: p,
      limit: l,
      totalCount: allMatchingTickets.length,
      hasMore: (skip + paginatedTickets.length) < allMatchingTickets.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  assignTechnician,
  updateTicketStatus,
  submitWorkCompletion,
  verifyWork,
  closeTicket,
  cancelTicket,
  getCustomers,
  addCustomer,
  updateCustomer,
  getDashboardStats,
  sendCustomAdminMessage,
  getReports
};

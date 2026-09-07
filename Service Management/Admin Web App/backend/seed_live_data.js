const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Ticket = require('./models/Ticket');
const Customer = require('./models/Customer');
const Appliance = require('./models/Appliance');
const Brand = require('./models/Brand');
const Amc = require('./models/Amc');

async function seedLiveData() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/global_service_point';
    await mongoose.connect(mongoUri);
    console.log('Connected to DB for seeding live sample data...');

    // Find or create admin, dealer, tech
    let admin = await User.findOne({ role: 'admin' });
    let dealer = await User.findOne({ role: 'dealer' });
    let tech = await User.findOne({ role: 'technician' });

    if (!admin) {
      admin = await User.create({ name: 'GSP Super Admin', email: 'admin@gsp.com', password: 'gsp@123', role: 'admin', code: 'ADMIN-01' });
    }
    if (!dealer) {
      dealer = await User.create({ name: 'Apex Dealers', email: 'dealer@gsp.com', password: 'dealer@123', role: 'dealer', code: 'DLR-1001', mobile: '9876543210', address: '123 Business Ave', city: 'Hubli' });
    }
    if (!tech) {
      tech = await User.create({ name: 'Alex Swift', email: 'tech@gsp.com', password: 'tech@123', role: 'technician', code: 'TECH-1001', mobile: '8887776665' });
    }

    // Seed additional technicians
    let tech2 = await User.findOne({ code: 'TECH-1002' });
    if (!tech2) {
      tech2 = await User.create({ name: 'Rahul Sharma', email: 'rahul.tech@gsp.com', password: 'tech@123', role: 'technician', code: 'TECH-1002', mobile: '9888777123', status: 'active' });
    }
    let tech3 = await User.findOne({ code: 'TECH-1003' });
    if (!tech3) {
      tech3 = await User.create({ name: 'Suresh Kumar', email: 'suresh.tech@gsp.com', password: 'tech@123', role: 'technician', code: 'TECH-1003', mobile: '9888777456', status: 'active' });
    }

    // Seed appliances
    let wm = await Appliance.findOne({ name: 'Washing Machine' }) || await Appliance.create({ name: 'Washing Machine' });
    let ac = await Appliance.findOne({ name: 'Air Conditioner' }) || await Appliance.create({ name: 'Air Conditioner' });

    // Seed brands
    let lg = await Brand.findOne({ name: 'LG' }) || await Brand.create({ name: 'LG', appliance: wm._id, followUpDays: 90, serviceFee: 400, installationFee: 600, technicianServiceFee: 250, technicianInstallationFee: 400 });
    let samsung = await Brand.findOne({ name: 'Samsung' }) || await Brand.create({ name: 'Samsung', appliance: wm._id, followUpDays: 180, serviceFee: 450, installationFee: 700, technicianServiceFee: 300, technicianInstallationFee: 450 });
    let daikin = await Brand.findOne({ name: 'Daikin' }) || await Brand.create({ name: 'Daikin', appliance: ac._id, followUpDays: 90, serviceFee: 500, installationFee: 800, technicianServiceFee: 350, technicianInstallationFee: 500 });

    // Seed Customers
    const customersData = [
      { name: 'Vijay Anand', mobile: '9123456789', alternateMobile: '9876501234', address: 'Flat 401, Galaxy Heights, Station Road', city: 'Hubli', pincode: '580020' },
      { name: 'Priya Verma', mobile: '9234567890', alternateMobile: '9876505678', address: 'Plot 12, Vidyanagar Main Street', city: 'Hubli', pincode: '580021' },
      { name: 'Ramesh Hegde', mobile: '9345678901', alternateMobile: '9876509012', address: 'Door No 45, Keshwapur Road', city: 'Hubli', pincode: '580023' },
      { name: 'Ankita Kulkarni', mobile: '9456789012', alternateMobile: '9876512345', address: 'Near Bus Stand, Gokul Road', city: 'Hubli', pincode: '580030' }
    ];

    const createdCustomers = [];
    for (const cData of customersData) {
      let cust = await Customer.findOne({ mobile: cData.mobile });
      if (!cust) {
        cust = await Customer.create(cData);
      }
      createdCustomers.push(cust);
    }
    console.log(`Seeded ${createdCustomers.length} Customers.`);

    // Seed AMC Contracts
    let amc1 = await Amc.findOne({ amcAmount: 2500 });
    if (!amc1) {
      amc1 = await Amc.create({
        customer: createdCustomers[0]._id,
        appliance: wm._id,
        amcType: 'service_only',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        amcAmount: 2500,
        visitsIncluded: 4,
        status: 'active'
      });
    }

    // Seed Tickets with distinct statuses and timeline history
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

    const ticketsToCreate = [
      {
        ticketNumber: 'TKT-1001',
        type: 'service',
        customer: { name: createdCustomers[0].name, mobile: createdCustomers[0].mobile, address: createdCustomers[0].address, city: createdCustomers[0].city, pincode: createdCustomers[0].pincode },
        product: { name: lg.name, category: wm.name },
        complaint: 'Washing machine drum not spinning and making loud noise',
        status: 'new',
        dealer: dealer._id,
        createdAt: now
      },
      {
        ticketNumber: 'TKT-1002',
        type: 'installation',
        customer: { name: createdCustomers[1].name, mobile: createdCustomers[1].mobile, address: createdCustomers[1].address, city: createdCustomers[1].city, pincode: createdCustomers[1].pincode },
        product: { name: daikin.name, category: ac.name },
        complaint: 'New Daikin AC wall mounting & outdoor unit installation required',
        status: 'assigned',
        dealer: dealer._id,
        assignedTechnician: tech._id,
        assignedAt: now,
        timeline: [
          { status: 'new', timestamp: yesterday },
          { status: 'assigned', timestamp: now, note: 'Assigned to Alex Swift' }
        ],
        createdAt: yesterday
      },
      {
        ticketNumber: 'TKT-1003',
        type: 'service',
        customer: { name: createdCustomers[2].name, mobile: createdCustomers[2].mobile, address: createdCustomers[2].address, city: createdCustomers[2].city, pincode: createdCustomers[2].pincode },
        product: { name: samsung.name, category: wm.name },
        complaint: 'Water leakage from bottom drain hose during wash cycle',
        status: 'in_progress',
        dealer: dealer._id,
        assignedTechnician: tech2._id,
        assignedAt: yesterday,
        timeline: [
          { status: 'new', timestamp: yesterday },
          { status: 'assigned', timestamp: yesterday, note: 'Assigned to Rahul Sharma' },
          { status: 'in_progress', timestamp: now, note: 'Technician reached customer location' }
        ],
        createdAt: yesterday
      },
      {
        ticketNumber: 'TKT-1004',
        type: 'service',
        customer: { name: createdCustomers[3].name, mobile: createdCustomers[3].mobile, address: createdCustomers[3].address, city: createdCustomers[3].city, pincode: createdCustomers[3].pincode },
        product: { name: lg.name, category: wm.name },
        complaint: 'Power failure issue - unit not turning on',
        status: 'verification_pending',
        dealer: dealer._id,
        assignedTechnician: tech._id,
        assignedAt: yesterday,
        completion: {
          submittedAt: now,
          remarks: 'Replaced main power cord and PCB fuse. Tested working fine.',
          photos: []
        },
        timeline: [
          { status: 'new', timestamp: yesterday },
          { status: 'assigned', timestamp: yesterday },
          { status: 'in_progress', timestamp: yesterday },
          { status: 'verification_pending', timestamp: now, note: 'Work completed by Alex Swift' }
        ],
        createdAt: yesterday
      },
      {
        ticketNumber: 'TKT-1005',
        type: 'installation',
        customer: { name: createdCustomers[0].name, mobile: createdCustomers[0].mobile, address: createdCustomers[0].address, city: createdCustomers[0].city, pincode: createdCustomers[0].pincode },
        product: { name: daikin.name, category: ac.name },
        complaint: 'AC installation for master bedroom',
        status: 'closed',
        dealer: dealer._id,
        assignedTechnician: tech._id,
        assignedAt: lastMonth,
        closedAt: lastMonth,
        technicianEarning: 500,
        completion: {
          submittedAt: lastMonth,
          remarks: 'AC successfully mounted and tested cooling.',
          verifiedByAdmin: admin._id
        },
        timeline: [
          { status: 'new', timestamp: lastMonth },
          { status: 'assigned', timestamp: lastMonth },
          { status: 'in_progress', timestamp: lastMonth },
          { status: 'verification_pending', timestamp: lastMonth },
          { status: 'closed', timestamp: lastMonth, note: 'Approved by admin' }
        ],
        createdAt: lastMonth
      }
    ];

    for (const tData of ticketsToCreate) {
      try {
        const exists = await Ticket.findOne({ ticketNumber: tData.ticketNumber });
        if (!exists) {
          await Ticket.create(tData);
          console.log(`Seeded Ticket: ${tData.ticketNumber} (${tData.status})`);
        } else {
          console.log(`Ticket ${tData.ticketNumber} already exists.`);
        }
      } catch (tErr) {
        console.warn(`Skipping ticket ${tData.ticketNumber}: ${tErr.message}`);
      }
    }

    console.log('--- SEED LIVE DATA COMPLETE ---');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding live data:', err);
    process.exit(1);
  }
}

seedLiveData();

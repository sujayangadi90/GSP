const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Appliance = require('./models/Appliance');
const Brand = require('./models/Brand');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gsp_service_db');
    console.log('Connected to MongoDB for seeding...');

    // Seed Admin
    const adminExists = await User.findOne({ email: 'admin@gsp.com' });
    if (!adminExists) {
      await User.create({
        name: 'GSP Super Admin',
        email: 'admin@gsp.com',
        password: 'gsp@123',
        role: 'admin',
        code: 'ADMIN-01'
      });
      console.log('Seeded: Admin account (admin@gsp.com / gsp@123)');
    } else {
      console.log('Admin account already exists.');
    }

    // Seed Dealer
    const dealerExists = await User.findOne({ email: 'dealer@gsp.com' });
    if (!dealerExists) {
      await User.create({
        name: 'Apex Dealers',
        email: 'dealer@gsp.com',
        password: 'dealer@123',
        role: 'dealer',
        code: 'DLR-1001',
        contactPerson: 'John Doe',
        mobile: '9876543210',
        address: '123 Business Avenue',
        city: 'New York'
      });
      console.log('Seeded: Dealer account (DLR-1001 / dealer@123)');
    }

    // Seed Technician
    const techExists = await User.findOne({ email: 'tech@gsp.com' });
    if (!techExists) {
      await User.create({
        name: 'Alex Swift (Technician)',
        email: 'tech@gsp.com',
        password: 'tech@123',
        role: 'technician',
        code: 'TECH-1001',
        mobile: '8887776665'
      });
      console.log('Seeded: Technician account (TECH-1001 / tech@123)');
    }

    // Seed Appliances
    let wm = await Appliance.findOne({ name: 'Washing Machine' });
    if (!wm) {
      wm = await Appliance.create({ name: 'Washing Machine' });
      console.log('Seeded Appliance: Washing Machine');
    }
    let ac = await Appliance.findOne({ name: 'Air Conditioner' });
    if (!ac) {
      ac = await Appliance.create({ name: 'Air Conditioner' });
      console.log('Seeded Appliance: Air Conditioner');
    }

    // Seed Brands
    if (wm) {
      const lgExists = await Brand.findOne({ name: 'LG', appliance: wm._id });
      if (!lgExists) {
        await Brand.create({ name: 'LG', appliance: wm._id, followUpDays: 90 });
        console.log('Seeded Brand: LG for Washing Machine');
      }
      const samsungExists = await Brand.findOne({ name: 'Samsung', appliance: wm._id });
      if (!samsungExists) {
        await Brand.create({ name: 'Samsung', appliance: wm._id, followUpDays: 180 });
        console.log('Seeded Brand: Samsung for Washing Machine');
      }
    }

    if (ac) {
      const daikinExists = await Brand.findOne({ name: 'Daikin', appliance: ac._id });
      if (!daikinExists) {
        await Brand.create({ name: 'Daikin', appliance: ac._id, followUpDays: 90 });
        console.log('Seeded Brand: Daikin for Air Conditioner');
      }
      const voltasExists = await Brand.findOne({ name: 'Voltas', appliance: ac._id });
      if (!voltasExists) {
        await Brand.create({ name: 'Voltas', appliance: ac._id, followUpDays: 120 });
        console.log('Seeded Brand: Voltas for Air Conditioner');
      }
    }

    console.log('Seeding finished.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();

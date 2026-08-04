const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gsp_service_db');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing users if desired (optional, but keep it safe by checking first)
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

    console.log('Seeding finished.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();

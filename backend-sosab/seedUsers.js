const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    // 1. Admin User
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@company.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: process.env.DEFAULT_ADMIN_NAME || 'System Admin',
        email: adminEmail,
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'AdminSecurePassword123!',
        role: 'admin',
      });
      console.log('✔ Admin user created:', admin.email);
    } else {
      console.log('ℹ Admin user already exists:', admin.email);
    }

    // 2. Gerant User
    const gerantEmail = 'verify.gerant@company.com';
    let gerant = await User.findOne({ email: gerantEmail });
    if (!gerant) {
      gerant = await User.create({
        name: 'Site Manager',
        email: gerantEmail,
        password: 'GerantVerifyPassword123!',
        role: 'gerant',
      });
      console.log('✔ Gerant user created:', gerant.email);
    } else {
      console.log('ℹ Gerant user already exists:', gerant.email);
    }

    console.log('\n==================================================');
    console.log('Database Seeding Complete!');
    console.log('Admin Account:  admin@company.com / AdminSecurePassword123!');
    console.log('Gerant Account: verify.gerant@company.com / GerantVerifyPassword123!');
    console.log('==================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding users:', err.message);
    process.exit(1);
  }
}

seed();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');

const setKrishnaAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/srci_db');
    console.log('Connected to MongoDB');

    // Remove or demote any other admin users
    await User.updateMany(
      { role: 'admin', email: { $ne: 'krishna@gmail.com' } },
      { $set: { role: 'citizen' } }
    );
    console.log('Demoted any other admin accounts to citizen');

    // Check if krishna@gmail.com exists
    let user = await User.findOne({ email: 'krishna@gmail.com' });
    if (user) {
      user.name = 'Krishna (Gram Sevak Admin)';
      user.role = 'admin';
      user.passwordHash = 'Sgi@5555';
      user.isActive = true;
      await user.save();
      console.log('Updated existing user krishna@gmail.com to Admin with password Sgi@5555');
    } else {
      user = await User.create({
        name: 'Krishna (Gram Sevak Admin)',
        email: 'krishna@gmail.com',
        passwordHash: 'Sgi@5555',
        role: 'admin',
        village: 'Gram Panchayat Chandoli',
        language: 'mr',
        phone: '+91 98230 11223',
        specialization: 'General',
        isActive: true,
      });
      console.log('Created new Admin user krishna@gmail.com with password Sgi@5555');
    }

    console.log('==============================================');
    console.log(' SOLE ADMIN CONFIGURATION COMPLETE:');
    console.log(' Email:    krishna@gmail.com');
    console.log(' Password: Sgi@5555');
    console.log(' Role:     admin');
    console.log('==============================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin:', error);
    process.exit(1);
  }
};

setKrishnaAdmin();

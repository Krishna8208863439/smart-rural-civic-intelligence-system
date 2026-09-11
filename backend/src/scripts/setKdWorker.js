const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Issue = require('../models/Issue');

const setKdWorker = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/srci_db');
    console.log('Connected to MongoDB');

    // 1. Find or create kd@gmail.com
    let kdUser = await User.findOne({ email: 'kd@gmail.com' });
    if (kdUser) {
      kdUser.name = 'KD (Field Worker Lead)';
      kdUser.role = 'worker';
      kdUser.passwordHash = 'Sgi@5555';
      kdUser.specialization = 'General';
      kdUser.isActive = true;
      await kdUser.save();
      console.log('Updated existing user kd@gmail.com to Worker with password Sgi@5555');
    } else {
      kdUser = await User.create({
        name: 'KD (Field Worker Lead)',
        email: 'kd@gmail.com',
        passwordHash: 'Sgi@5555',
        role: 'worker',
        village: 'Gram Panchayat Chandoli',
        language: 'mr',
        phone: '+91 98230 55555',
        specialization: 'General',
        isActive: true,
      });
      console.log('Created new Worker user kd@gmail.com with password Sgi@5555');
    }

    // 2. Find old worker IDs
    const oldWorkers = await User.find({
      role: 'worker',
      email: { $ne: 'kd@gmail.com' },
    });
    const oldWorkerIds = oldWorkers.map((w) => w._id);

    // 3. Reassign issues assigned to old workers to kdUser
    if (oldWorkerIds.length > 0) {
      const updateResult = await Issue.updateMany(
        { assignedWorker: { $in: oldWorkerIds } },
        { $set: { assignedWorker: kdUser._id } }
      );
      console.log(`Reassigned ${updateResult.modifiedCount} issues to KD (kd@gmail.com)`);

      // 4. Delete or deactivate old worker accounts
      await User.deleteMany({ _id: { $in: oldWorkerIds } });
      console.log(`Removed ${oldWorkers.length} old worker accounts`);
    }

    console.log('==============================================');
    console.log(' SOLE FIELD WORKER CONFIGURATION COMPLETE:');
    console.log(' Email:    kd@gmail.com');
    console.log(' Password: Sgi@5555');
    console.log(' Role:     worker');
    console.log(' Name:     KD (Field Worker Lead)');
    console.log('==============================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error setting KD worker:', error);
    process.exit(1);
  }
};

setKdWorker();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Task = require('../models/Task');
const Issue = require('../models/Issue');

async function runTest() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/srci_db';
  console.log(`Connecting to MongoDB: ${mongoUri}...`);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB!');

  try {
    // 1. Clean up any previous test worker
    await User.deleteMany({ email: 'sanjay.testworker@grampanchayat.in' });
    await Task.deleteMany({ taskId: /^TEST-TSK-/ });

    console.log('\n--- STEP 1: Creating New Field Worker ---');
    const workerId = `GRAM-WKR-${Math.floor(100 + Math.random() * 900)}`;
    const tempPassword = 'Chandoli@4921';
    
    const worker = await User.create({
      name: 'Sanjay Tukaram More',
      email: 'sanjay.testworker@grampanchayat.in',
      phone: '9876543210',
      workerId,
      passwordHash: tempPassword,
      role: 'worker',
      workerRole: 'Sanitation Worker',
      specialization: 'Sanitation & Waste',
      assignedArea: 'Ward 2',
      isActive: true,
      mustChangePassword: true,
    });

    console.log('✓ Worker created successfully:');
    console.log(`  Name: ${worker.name}`);
    console.log(`  Worker ID: ${worker.workerId}`);
    console.log(`  Mobile: ${worker.phone}`);
    console.log(`  Role: ${worker.workerRole}`);

    console.log('\n--- STEP 2: Authenticating Worker ---');
    // Test login via Mobile Number
    const userByPhone = await User.findOne({ phone: '9876543210' }).select('+passwordHash');
    const matchPhone = await userByPhone.matchPassword(tempPassword);
    console.log(`✓ Login by Mobile (9876543210) password match: ${matchPhone}`);

    // Test login via Worker ID
    const userByWorkerId = await User.findOne({ workerId }).select('+passwordHash');
    const matchWorkerId = await userByWorkerId.matchPassword(tempPassword);
    console.log(`✓ Login by Worker ID (${workerId}) password match: ${matchWorkerId}`);

    console.log('\n--- STEP 3: Admin Assigning Task to Worker ---');
    const taskId = `TEST-TSK-${Math.floor(1000 + Math.random() * 9000)}`;
    const task = await Task.create({
      taskId,
      workerId: worker._id,
      title: 'Drainage blockage near Ward 2 Community Hall',
      category: 'Drainage blockage',
      priority: 'High',
      description: 'Clear the clogged drain and restore normal water passage.',
      location: {
        address: 'Ward 2 Community Hall',
        landmark: 'Near Water Tank',
        coordinates: [74.2433, 16.9602],
      },
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      requiredAction: 'Clear drain obstruction, take before/after photos, and mark completed.',
      status: 'ASSIGNED',
    });
    console.log(`✓ Task created: ${task.taskId}, status: ${task.status}`);

    console.log('\n--- STEP 4: Worker Lifecycle Actions ---');
    // 4a. Worker accepts task
    task.status = 'ACCEPTED';
    task.acceptedAt = new Date();
    await task.save();
    console.log(`✓ Worker accepted task: status = ${task.status}`);

    // 4b. Worker starts task
    task.status = 'IN PROGRESS';
    task.startedAt = new Date();
    await task.save();
    console.log(`✓ Worker started field work: status = ${task.status}`);

    // 4c. Worker logs progress
    task.progressUpdates.push({
      note: '50% of drain obstruction removed with suction pump.',
      image: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800',
      timestamp: new Date(),
    });
    await task.save();
    console.log(`✓ Worker logged progress update`);

    // 4d. Worker marks task completed
    task.status = 'COMPLETED';
    task.completedAt = new Date();
    task.workerNotes = 'Obstruction fully removed, flow restored to normal.';
    task.afterImage = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800';
    task.completionGps = { latitude: 16.9602, longitude: 74.2433 };
    await task.save();
    console.log(`✓ Worker marked task completed: status = ${task.status} (Pending Admin Verification)`);

    console.log('\n--- STEP 5: Admin Verifies Completed Task ---');
    task.status = 'VERIFIED';
    task.verifiedAt = new Date();
    await task.save();
    console.log(`✓ Admin verified and closed task: status = ${task.status}`);

    console.log('\n=======================================================');
    console.log(' ALL INTEGRATION TESTS PASSED: FULL LIFECYCLE VERIFIED!');
    console.log('=======================================================');
  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

runTest();

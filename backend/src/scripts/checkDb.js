/**
 * MongoDB Connection & Health Diagnostic Tool for SRCI
 * Run: node src/scripts/checkDb.js
 */
const path = require('path');
const dotenv = require('dotenv');

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const { connectDB, getDBStatus } = require('../config/db');

// Models
const User = require('../models/User');
const Issue = require('../models/Issue');
const CommunityValidation = require('../models/CommunityValidation');
const PreventiveAction = require('../models/PreventiveAction');
const RecurrenceProfile = require('../models/RecurrenceProfile');
const Evidence = require('../models/Evidence');
const IssueHistory = require('../models/IssueHistory');
const Notification = require('../models/Notification');

async function runDiagnostics() {
  console.log('---------------------------------------------------------');
  console.log(' 🍃 SRCI GramSetu AI — MongoDB Diagnostic & Health Tool');
  console.log('---------------------------------------------------------');

  const startTime = Date.now();
  const conn = await connectDB();

  if (!conn) {
    console.error('❌ Failed to establish connection to MongoDB.');
    process.exit(1);
  }

  const status = getDBStatus();
  console.log('\n📊 Connection Details:');
  console.log(`   - Status:      ${status.state.toUpperCase()}`);
  console.log(`   - Host:        ${status.host}`);
  console.log(`   - Port:        ${status.port || 'N/A (Cloud Cluster)'}`);
  console.log(`   - Database:    ${status.name}`);
  console.log(`   - Latency:     ${Date.now() - startTime}ms`);

  console.log('\n📦 Verifying Data Models & Collections:');

  const models = [
    { name: 'Users', model: User },
    { name: 'Civic Issues', model: Issue },
    { name: 'Community Validations', model: CommunityValidation },
    { name: 'Preventive Actions', model: PreventiveAction },
    { name: 'Recurrence Profiles', model: RecurrenceProfile },
    { name: 'Evidences / Attachments', model: Evidence },
    { name: 'Issue Histories (Audit Log)', model: IssueHistory },
    { name: 'Notifications', model: Notification },
  ];

  for (const { name, model } of models) {
    try {
      const count = await model.countDocuments();
      console.log(`   ✅ ${name.padEnd(30)} : ${count} records`);
    } catch (err) {
      console.error(`   ❌ ${name.padEnd(30)} : Query Error (${err.message})`);
    }
  }

  console.log('\n✨ Database is fully functional and ready for SRCI services.');
  console.log('---------------------------------------------------------\n');

  await mongoose.disconnect();
  process.exit(0);
}

runDiagnostics().catch((err) => {
  console.error('Fatal diagnostic error:', err);
  process.exit(1);
});

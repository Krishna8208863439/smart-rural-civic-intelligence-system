const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Issue = require('../models/Issue');
const Evidence = require('../models/Evidence');
const IssueHistory = require('../models/IssueHistory');
const RecurrenceProfile = require('../models/RecurrenceProfile');
const PreventiveAction = require('../models/PreventiveAction');
const CommunityValidation = require('../models/CommunityValidation');
const Notification = require('../models/Notification');

async function exportData() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/srci_db';
  await mongoose.connect(mongoUri);

  const data = {
    users: await User.find({}).select('+passwordHash').lean(),
    issues: await Issue.find({}).lean(),
    evidences: await Evidence.find({}).lean(),
    issueHistories: await IssueHistory.find({}).lean(),
    recurrenceProfiles: await RecurrenceProfile.find({}).lean(),
    preventiveActions: await PreventiveAction.find({}).lean(),
    communityValidations: await CommunityValidation.find({}).lean(),
    notifications: await Notification.find({}).lean(),
  };

  const outPath = path.join(__dirname, '../../../python_backend/seed_data.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`Exported successfully to ${outPath}`);
  console.log(`Users: ${data.users.length}, Issues: ${data.issues.length}, Profiles: ${data.recurrenceProfiles.length}`);

  await mongoose.disconnect();
}

exportData().catch(console.error);

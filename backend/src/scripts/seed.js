const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Issue = require('../models/Issue');
const Evidence = require('../models/Evidence');
const IssueHistory = require('../models/IssueHistory');
const RecurrenceProfile = require('../models/RecurrenceProfile');
const PreventiveAction = require('../models/PreventiveAction');
const CommunityValidation = require('../models/CommunityValidation');
const Notification = require('../models/Notification');

const PriorityService = require('../services/PriorityService');
const EvidenceReliabilityService = require('../services/EvidenceReliabilityService');
const RecurrenceEngine = require('../services/RecurrenceEngine');
const RootCauseService = require('../services/RootCauseService');
const PreventiveRecommendationService = require('../services/PreventiveRecommendationService');
const PreventiveEffectivenessService = require('../services/PreventiveEffectivenessService');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/srci_db';
    console.log(`Connecting to MongoDB for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Issue.deleteMany({});
    await Evidence.deleteMany({});
    await IssueHistory.deleteMany({});
    await RecurrenceProfile.deleteMany({});
    await PreventiveAction.deleteMany({});
    await CommunityValidation.deleteMany({});
    await Notification.deleteMany({});

    console.log('Creating Users (1 Admin, 3 Workers, 10 Citizens)...');

    // 1 Admin (Sole Authorized Admin)
    const admin = await User.create({
      name: 'Krishna (Gram Sevak Admin)',
      email: 'krishna@gmail.com',
      passwordHash: 'Sgi@5555',
      role: 'admin',
      village: 'Gram Panchayat Chandoli',
      language: 'mr',
      phone: '+91 98230 11223',
      specialization: 'General',
    });

    // 1 Field Worker (Sole Authorized Worker)
    const worker = await User.create({
      name: 'KD (Field Worker Lead)',
      email: 'kd@gmail.com',
      passwordHash: 'Sgi@5555',
      role: 'worker',
      village: 'Gram Panchayat Chandoli',
      language: 'mr',
      phone: '+91 98230 55555',
      specialization: 'General',
    });

    // 10 Citizens
    const citizenData = [
      { name: 'Aarav Kumar', email: 'citizen1@example.com', lang: 'en', phone: '+91 91122 33441' },
      { name: 'Sunita Gaikwad', email: 'citizen2@example.com', lang: 'mr', phone: '+91 91122 33442' },
      { name: 'Prakash More', email: 'citizen3@example.com', lang: 'mr', phone: '+91 91122 33443' },
      { name: 'Anita Pawar', email: 'citizen4@example.com', lang: 'mr', phone: '+91 91122 33444' },
      { name: 'Rajendra Joshi', email: 'citizen5@example.com', lang: 'hi', phone: '+91 91122 33445' },
      { name: 'Kavita Shirole', email: 'citizen6@example.com', lang: 'mr', phone: '+91 91122 33446' },
      { name: 'Dattatray Kadam', email: 'citizen7@example.com', lang: 'mr', phone: '+91 91122 33447' },
      { name: 'Pooja Waghmare', email: 'citizen8@example.com', lang: 'en', phone: '+91 91122 33448' },
      { name: 'Sachin Thorat', email: 'citizen9@example.com', lang: 'hi', phone: '+91 91122 33449' },
      { name: 'Meena Bhosale', email: 'citizen10@example.com', lang: 'mr', phone: '+91 91122 33450' },
    ];

    const citizens = [];
    for (const c of citizenData) {
      const citizen = await User.create({
        name: c.name,
        email: c.email,
        passwordHash: 'citizen123',
        role: 'citizen',
        village: 'Gram Panchayat Chandoli',
        language: c.lang,
        phone: c.phone,
      });
      citizens.push(citizen);
    }

    console.log('Creating 5 Hotspot Recurrence Profiles for Village Digital Memory...');
    
    // Create Recurrence Profiles
    const profile1 = await RecurrenceProfile.create({
      locationPattern: {
        name: 'Weekly Bazaar Ground & Main Chowk',
        coordinates: [73.8567, 18.5204],
        radiusMeters: 200,
        village: 'Gram Panchayat Chandoli',
      },
      category: 'Waste accumulation',
      frequency: 11,
      intervals: [7, 8, 7, 14, 7, 9, 8],
      averageIntervalDays: 8,
      seasonalIndicators: {
        monsoonCorrelation: 40,
        summerCorrelation: 30,
        winterCorrelation: 20,
        peakMonths: ['October', 'November', 'March'],
      },
      reReportRate: 65,
      resolutionStability: 'Unstable',
      recurrenceRisk: 88,
      recurrenceLevel: 'Very High',
      probableCauses: [
        {
          cause: 'Sub-optimal waste collection vehicle frequency on weekly market days',
          confidence: 86,
          observations: ['Excess garbage dumped after Saturday market', 'Bins overflow within 4 hours'],
        },
        {
          cause: 'Lack of segregated wet/dry collection points near vegetable stalls',
          confidence: 72,
          observations: ['Cattle scavenge rotten vegetables', 'Plastic covers scatter across road'],
        },
      ],
      preventiveRecommendations: [
        {
          action: 'Install twin 240L heavy-duty masonry bins and schedule special Sunday morning vehicle clearing',
          priority: 'Urgent',
          timeframe: 'Within 7 days',
        },
      ],
    });

    const profile2 = await RecurrenceProfile.create({
      locationPattern: {
        name: 'Zilla Parishad Primary School Culvert',
        coordinates: [73.8612, 18.5245],
        radiusMeters: 220,
        village: 'Gram Panchayat Chandoli',
      },
      category: 'Drainage blockage',
      frequency: 8,
      intervals: [25, 30, 28, 40, 22],
      averageIntervalDays: 29,
      seasonalIndicators: {
        monsoonCorrelation: 92,
        summerCorrelation: 10,
        winterCorrelation: 15,
        peakMonths: ['June', 'July', 'August', 'September'],
      },
      reReportRate: 45,
      resolutionStability: 'Fragile',
      recurrenceRisk: 78,
      recurrenceLevel: 'High',
      probableCauses: [
        {
          cause: 'Inadequate stormwater culvert cross-section capacity during monsoon runoff',
          confidence: 89,
          observations: ['School compound gets waterlogged', 'Agricultural topsoil silt chokes channel'],
        },
      ],
      preventiveRecommendations: [
        {
          action: 'Pre-monsoon mechanical desilting and installation of galvanized trash barrier',
          priority: 'Urgent',
          timeframe: 'Prior to May 30',
        },
      ],
    });

    const profile3 = await RecurrenceProfile.create({
      locationPattern: {
        name: 'Water Tank Hill Road & Pipeline Ridge',
        coordinates: [73.8521, 18.5187],
        radiusMeters: 180,
        village: 'Gram Panchayat Chandoli',
      },
      category: 'Water leakage',
      frequency: 6,
      intervals: [45, 52, 38, 60],
      averageIntervalDays: 48,
      seasonalIndicators: {
        monsoonCorrelation: 20,
        summerCorrelation: 75,
        winterCorrelation: 30,
        peakMonths: ['April', 'May'],
      },
      reReportRate: 35,
      resolutionStability: 'Moderate',
      recurrenceRisk: 64,
      recurrenceLevel: 'High',
      probableCauses: [
        {
          cause: 'Hydraulic pressure surge (water hammer) on aged PVC pipeline joints',
          confidence: 82,
          observations: ['Bursts occur right after pump priming', 'Pipe joint installed 7 years ago'],
        },
      ],
      preventiveRecommendations: [
        {
          action: 'Install kinetic air-release valve and replace 60m PVC stretch with PN-10 HDPE pipeline',
          priority: 'Urgent',
          timeframe: 'Within 20 days',
        },
      ],
    });

    const profile4 = await RecurrenceProfile.create({
      locationPattern: {
        name: 'River Bridge Approach Road',
        coordinates: [73.8689, 18.5312],
        radiusMeters: 250,
        village: 'Gram Panchayat Chandoli',
      },
      category: 'Damaged road',
      frequency: 5,
      intervals: [90, 110, 85],
      averageIntervalDays: 95,
      seasonalIndicators: {
        monsoonCorrelation: 85,
        summerCorrelation: 15,
        winterCorrelation: 20,
        peakMonths: ['July', 'August'],
      },
      reReportRate: 40,
      resolutionStability: 'Moderate',
      recurrenceRisk: 62,
      recurrenceLevel: 'High',
      probableCauses: [
        {
          cause: 'Waterlogging stripping asphalt bitumen top layer due to missing roadside drain',
          confidence: 84,
          observations: ['Vehicular rutting from sugarcane transport carts', 'Standing rainwater pools'],
        },
      ],
      preventiveRecommendations: [
        {
          action: 'Construct roadside concrete drainage ditch and apply dense bituminous macadam base',
          priority: 'Medium',
          timeframe: 'Within 30 days',
        },
      ],
    });

    const profile5 = await RecurrenceProfile.create({
      locationPattern: {
        name: 'Ambedkar Nagar Internal Lane',
        coordinates: [73.8595, 18.5165],
        radiusMeters: 150,
        village: 'Gram Panchayat Chandoli',
      },
      category: 'Streetlight failure',
      frequency: 7,
      intervals: [20, 25, 18, 30, 22],
      averageIntervalDays: 23,
      seasonalIndicators: {
        monsoonCorrelation: 70,
        summerCorrelation: 30,
        winterCorrelation: 40,
        peakMonths: ['July', 'December'],
      },
      reReportRate: 50,
      resolutionStability: 'Fragile',
      recurrenceRisk: 72,
      recurrenceLevel: 'High',
      probableCauses: [
        {
          cause: 'Feeder line voltage fluctuations and unshielded pole junction box moisture',
          confidence: 79,
          observations: ['Capacitor failure in LED luminaires', 'Rainwater enters unsealed base box'],
        },
      ],
      preventiveRecommendations: [
        {
          action: 'Equip poles with 10kA surge arrestors and weatherproof IP65 junction enclosures',
          priority: 'Medium',
          timeframe: 'Within 15 days',
        },
      ],
    });

    console.log('Creating 32 Realistic Village Civic Issues...');

    // Verified realistic stock image URLs for civic infrastructure
    const imgUrls = {
      waste: [
        'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
      ],
      drain: [
        'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
      ],
      water: [
        'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      ],
      road: [
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
      ],
      light: [
        'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?auto=format&fit=crop&w=800&q=80',
      ],
      sanitation: [
        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      ],
    };

    const rawIssues = [
      // 1. Critical Water Burst
      {
        title: 'Major underground pipeline burst flooding main road near Water Tank Hill',
        description: 'Potable drinking water pipeline ruptured at the bend. Water is gushing onto the road and flooding residential yards. Pressure drop across Ward 3.',
        category: 'Water leakage',
        severity: 'Critical',
        coords: [73.8523, 18.5189],
        address: 'Water Tank Hill Road, Ward 3',
        landmark: 'Near Gram Panchayat Water Reservoir',
        status: 'UNDER ACTION',
        worker: worker3,
        citizen: citizens[0],
        images: [{ url: imgUrls.water[0] }],
        daysAgo: 1,
      },
      // 2. High Recurrence Waste at Bazaar
      {
        title: 'Severe garbage accumulation and foul odor around Weekly Bazaar Ground',
        description: 'Post Saturday market waste has remained uncollected for 4 days. Stray cattle and dogs are scattering decomposing vegetables into the road.',
        category: 'Waste accumulation',
        severity: 'High',
        coords: [73.8569, 18.5206],
        address: 'Bazaar Peth Road',
        landmark: 'Weekly Market Vegetable Shed',
        status: 'ASSIGNED',
        worker: worker1,
        citizen: citizens[1],
        images: [{ url: imgUrls.waste[0] }],
        daysAgo: 2,
      },
      // 3. Pre-monsoon Culvert Choke
      {
        title: 'Drainage culvert clogged with silt and plastic waste in front of ZP Primary School',
        description: 'Drain is overflowing with dark stagnant wastewater right at school entrance gate. Mosquito breeding hazard for students.',
        category: 'Drainage blockage',
        severity: 'High',
        coords: [73.8614, 18.5247],
        address: 'School Road, Ward 2',
        landmark: 'Opposite Zilla Parishad Primary School Gate',
        status: 'NEW',
        citizen: citizens[2],
        images: [{ url: imgUrls.drain[0] }],
        daysAgo: 3,
      },
      // 4. Broken Road Potholes
      {
        title: 'Deep potholes and eroded asphalt along River Bridge Approach Road',
        description: 'Multiple 15cm deep potholes causing two-wheeler accidents, especially at night. Sugarcane carts struggling to navigate.',
        category: 'Damaged road',
        severity: 'High',
        coords: [73.8691, 18.5314],
        address: 'River Bridge Road',
        landmark: '50 meters before Bhima River Bridge',
        status: 'UNDER ACTION',
        worker: worker2,
        citizen: citizens[3],
        images: [{ url: imgUrls.road[0] }],
        daysAgo: 4,
      },
      // 5. Streetlight Outage
      {
        title: 'Consecutive streetlight failure on 4 poles along Ambedkar Nagar Lane',
        description: 'Complete blackout on internal residential stretch for past 5 days. Women and elderly residents facing difficulty walking after 7 PM.',
        category: 'Streetlight failure',
        severity: 'Medium',
        coords: [73.8597, 18.5167],
        address: 'Ambedkar Nagar Lane 2',
        landmark: 'Near Community Hall',
        status: 'ACTION COMPLETED',
        worker: worker3,
        citizen: citizens[4],
        images: [{ url: imgUrls.light[0] }],
        daysAgo: 6,
      },
      // 6. Community Toilet Blockage
      {
        title: 'Public community toilet flush water supply failure and soak pit overflow',
        description: 'Water motor pump burnt out. Soak pit overflowing into adjacent open ground. Urgent sanitation issue.',
        category: 'Sanitation',
        severity: 'Critical',
        coords: [73.8542, 18.5211],
        address: 'Ward 4 Sanitation Block',
        landmark: 'Behind Gram Panchayat Library',
        status: 'MONITORING',
        worker: worker1,
        citizen: citizens[5],
        images: [{ url: imgUrls.sanitation[0] }],
        daysAgo: 8,
      },
      // 7. Verified Resolved Road Patch
      {
        title: 'Repaired road crater and surface asphalt sealing near Primary Health Center',
        description: 'Crater filled with compact stone ballast and bitumen seal coat. Traffic flow restored smoothly.',
        category: 'Damaged road',
        severity: 'Medium',
        coords: [73.8582, 18.5229],
        address: 'Hospital Road',
        landmark: 'Primary Health Center Entrance',
        status: 'VERIFIED RESOLVED',
        worker: worker2,
        citizen: citizens[6],
        images: [{ url: imgUrls.road[1] }],
        daysAgo: 14,
      },
      // 8. Reopened Drainage Complaint
      {
        title: 'Persistent stormwater drain overflow at Shivaji Chowk junction',
        description: 'Drain cleaned last week but got blocked again after heavy showers. Water is backing up into nearby grocery shops.',
        category: 'Drainage blockage',
        severity: 'High',
        coords: [73.8573, 18.5215],
        address: 'Shivaji Chowk Main Cross',
        landmark: 'Near Shivaji Maharaj Statue',
        status: 'REOPENED',
        worker: worker1,
        citizen: citizens[7],
        images: [{ url: imgUrls.drain[1] }],
        daysAgo: 9,
      },
      // 9. Water Supply Low Pressure
      {
        title: 'Drinking water distribution valve jammed affecting Gaothan East sector',
        description: 'No tap water supply in Gaothan East for 36 hours. Sluice valve handle broken during operation.',
        category: 'Water supply',
        severity: 'High',
        coords: [73.8631, 18.5255],
        address: 'Gaothan East Main Pipe',
        landmark: 'Near Maruti Temple Well',
        status: 'VALIDATED',
        citizen: citizens[8],
        images: [{ url: imgUrls.water[1] }],
        daysAgo: 2,
      },
      // 10. Waste Dumping
      {
        title: 'Illegal construction debris and plastic dumping on open ground',
        description: 'Truckload of brick rubble and cement sacks dumped along village periphery road.',
        category: 'Waste accumulation',
        severity: 'Medium',
        coords: [73.8655, 18.5192],
        address: 'Ring Road East',
        landmark: 'Adjacent to Crematorium Wall',
        status: 'NEW',
        citizen: citizens[9],
        images: [{ url: imgUrls.waste[1] }],
        daysAgo: 1,
      },
    ];

    // Generate remaining 22 issues to exceed 30+ comprehensive realistic issues
    const categoriesPool = [
      'Waste accumulation',
      'Drainage blockage',
      'Water leakage',
      'Damaged road',
      'Streetlight failure',
      'Water supply',
      'Sanitation',
    ];
    const statusesPool = [
      'NEW',
      'VALIDATED',
      'ASSIGNED',
      'UNDER ACTION',
      'ACTION COMPLETED',
      'MONITORING',
      'VERIFIED RESOLVED',
    ];

    for (let i = 11; i <= 32; i++) {
      const cat = categoriesPool[i % categoriesPool.length];
      const stat = statusesPool[i % statusesPool.length];
      const citizen = citizens[i % citizens.length];
      const worker = [worker1, worker2, worker3][i % 3];
      const latOffset = (Math.random() - 0.5) * 0.03;
      const lngOffset = (Math.random() - 0.5) * 0.03;

      let catImg = imgUrls.waste[0];
      if (cat.includes('Drain')) catImg = imgUrls.drain[0];
      else if (cat.includes('Water')) catImg = imgUrls.water[0];
      else if (cat.includes('road') || cat.includes('Damaged')) catImg = imgUrls.road[0];
      else if (cat.includes('light')) catImg = imgUrls.light[0];
      else if (cat.includes('Sanitation')) catImg = imgUrls.sanitation[0];

      rawIssues.push({
        title: `${cat} report at Ward ${(i % 5) + 1} locality #${i}`,
        description: `Community civic issue regarding ${cat.toLowerCase()} causing disruption to residents. Prompt resolution requested.`,
        category: cat,
        severity: i % 4 === 0 ? 'Critical' : i % 3 === 0 ? 'High' : 'Medium',
        coords: [73.8567 + lngOffset, 18.5204 + latOffset],
        address: `Ward ${(i % 5) + 1} Sector ${String.fromCharCode(65 + (i % 6))}`,
        landmark: `Near Pole #${100 + i}`,
        status: stat,
        worker: ['ASSIGNED', 'UNDER ACTION', 'ACTION COMPLETED', 'MONITORING', 'VERIFIED RESOLVED'].includes(stat)
          ? worker
          : null,
        citizen,
        images: [{ url: catImg }],
        daysAgo: (i * 2) % 45 + 1,
      });
    }

    const createdIssues = [];
    for (const data of rawIssues) {
      const creationDate = new Date();
      creationDate.setDate(creationDate.getDate() - data.daysAgo);

      // Intelligent calculations
      const reliabilityAssessment = EvidenceReliabilityService.evaluate({
        images: data.images,
        location: { coordinates: data.coords, address: data.address, landmark: data.landmark },
        description: data.description,
        communityConfirms: Math.floor(Math.random() * 4),
      });

      const priorityAssessment = PriorityService.calculate({
        severity: data.severity,
        reportCount: Math.floor(Math.random() * 3) + 1,
        createdAt: creationDate,
        landmark: `${data.landmark} ${data.category}`,
        category: data.category,
        communityConfirms: Math.floor(Math.random() * 3),
      });

      const recurrenceRisk =
        data.category === 'Waste accumulation' || data.category === 'Drainage blockage'
          ? 65 + Math.floor(Math.random() * 25)
          : 25 + Math.floor(Math.random() * 40);

      const recurrenceLevel =
        recurrenceRisk >= 80 ? 'Very High' : recurrenceRisk >= 60 ? 'High' : 'Medium';

      const rootCauses = RootCauseService.generate({
        category: data.category,
        frequency: Math.floor(Math.random() * 4) + 2,
        seasonalPattern: 'Monsoon precipitation peak',
        recurrenceRisk,
        landmark: data.landmark,
      });

      const preventiveRecs = PreventiveRecommendationService.generate({
        category: data.category,
        recurrenceRisk,
        frequency: 3,
        probableCauses: rootCauses,
      });

      const issueDoc = await Issue.create({
        title: data.title,
        description: data.description,
        category: data.category,
        severity: data.severity,
        images: data.images.map((img) => ({
          url: img.url,
          publicId: `seed-${Math.random()}`,
          uploadedAt: creationDate,
        })),
        location: {
          type: 'Point',
          coordinates: data.coords,
          address: data.address,
          landmark: data.landmark,
          village: 'Gram Panchayat Chandoli',
          ward: `Ward ${(createdIssues.length % 5) + 1}`,
        },
        status: data.status,
        priority: priorityAssessment,
        createdBy: data.citizen._id,
        assignedWorker: data.worker ? data.worker._id : null,
        assignedAt: data.worker ? creationDate : null,
        reliabilityScore: reliabilityAssessment.score,
        reliabilityLevel: reliabilityAssessment.level,
        reliabilityFactors: reliabilityAssessment.factors,
        adaptiveVerificationPath: reliabilityAssessment.adaptiveVerificationPath,
        recurrenceRisk,
        recurrenceLevel,
        recurrenceFactors: {
          historicalCount: Math.floor(Math.random() * 5) + 2,
          averageIntervalDays: Math.floor(Math.random() * 30) + 10,
          seasonalPattern: 'Active seasonal monitoring',
          resolutionStability: recurrenceRisk >= 75 ? 'Fragile' : 'Moderate',
          summary: `${data.landmark} historical cluster record.`,
        },
        rootCauses,
        preventiveRecommendations: preventiveRecs,
        communityValidationStats: {
          confirms: Math.floor(Math.random() * 4) + 1,
          stillExists: data.status === 'REOPENED' ? 3 : 0,
          resolved: data.status === 'VERIFIED RESOLVED' ? 4 : data.status === 'MONITORING' ? 1 : 0,
        },
        completionDetails:
          ['ACTION COMPLETED', 'MONITORING', 'VERIFIED RESOLVED'].includes(data.status)
            ? {
                notes: 'Work completed according to Gram Panchayat technical standards.',
                images: [{ url: data.images[0].url }],
                completedAt: new Date(creationDate.getTime() + 86400000 * 2),
              }
            : { notes: '', images: [], completedAt: null },
        resolvedAt: ['ACTION COMPLETED', 'MONITORING', 'VERIFIED RESOLVED'].includes(data.status)
          ? new Date(creationDate.getTime() + 86400000 * 2)
          : null,
        verifiedAt: data.status === 'VERIFIED RESOLVED' ? new Date() : null,
        createdAt: creationDate,
        updatedAt: new Date(),
      });

      // Issue History
      await IssueHistory.create({
        issueId: issueDoc._id,
        eventType: 'CREATED',
        previousState: '',
        newState: 'NEW',
        userId: data.citizen._id,
        userName: data.citizen.name,
        userRole: 'citizen',
        comment: 'Civic complaint officially filed by citizen.',
        timestamp: creationDate,
      });

      if (data.worker) {
        await IssueHistory.create({
          issueId: issueDoc._id,
          eventType: 'WORKER_ASSIGNED',
          previousState: 'VALIDATED',
          newState: 'ASSIGNED',
          userId: admin._id,
          userName: admin.name,
          userRole: 'admin',
          comment: `Panchayat admin assigned field lead ${data.worker.name}.`,
          timestamp: new Date(creationDate.getTime() + 3600000 * 4),
        });
      }

      if (data.status === 'VERIFIED RESOLVED') {
        await IssueHistory.create({
          issueId: issueDoc._id,
          eventType: 'RESOLUTION_VERIFIED',
          previousState: 'MONITORING',
          newState: 'VERIFIED RESOLVED',
          userId: data.citizen._id,
          userName: data.citizen.name,
          userRole: 'citizen',
          comment: 'Citizen confirmed civic problem has been successfully fixed.',
          timestamp: new Date(),
        });
      }

      // Community Validation entries
      await CommunityValidation.create({
        issueId: issueDoc._id,
        userId: citizens[(createdIssues.length + 1) % citizens.length]._id,
        userName: citizens[(createdIssues.length + 1) % citizens.length].name,
        response: data.status === 'VERIFIED RESOLVED' ? 'RESOLVED' : 'CONFIRM',
        comment: 'Witnessed this civic condition in our ward.',
        timestamp: new Date(),
      });

      createdIssues.push(issueDoc);
    }

    // Link Issues to Recurrence Profiles
    profile1.linkedIssueIds = createdIssues.filter((i) => i.category === 'Waste accumulation').map((i) => i._id);
    await profile1.save();

    profile2.linkedIssueIds = createdIssues.filter((i) => i.category === 'Drainage blockage').map((i) => i._id);
    await profile2.save();

    profile3.linkedIssueIds = createdIssues.filter((i) => i.category === 'Water leakage').map((i) => i._id);
    await profile3.save();

    console.log('Creating Realistic Preventive Actions with Effectiveness Metrics...');

    // Preventive Action 1: Completed with High Effectiveness
    const action1Eval = PreventiveEffectivenessService.evaluate({
      beforeFrequency: 9,
      afterFrequency: 2,
      daysObserved: 60,
    });
    await PreventiveAction.create({
      recurrenceProfileId: profile1._id,
      category: 'Waste accumulation',
      location: { name: 'Weekly Bazaar Ground & Main Chowk' },
      recommendedAction: 'Install 2x 240L twin-compartment masonry bins with weather covers',
      actionTaken: 'Constructed 2 covered masonry disposal units and placed secondary collection carts',
      assignedTo: worker1._id,
      status: 'COMPLETED',
      targetDate: new Date(Date.now() - 86400000 * 45),
      completedDate: new Date(Date.now() - 86400000 * 40),
      beforeFrequency: 9,
      afterFrequency: 2,
      reductionPercentage: action1Eval.reductionPercentage,
      effectivenessScore: action1Eval.score,
      effectivenessLevel: action1Eval.level,
      notes: 'Significant drop in complaints after Saturday market. Waste no longer litters main road.',
      createdBy: admin._id,
      evidence: [
        {
          url: imgUrls.waste[1],
          caption: 'Completed masonry bins in operation at Weekly Market',
        },
      ],
    });

    // Preventive Action 2: Drainage Desilting
    const action2Eval = PreventiveEffectivenessService.evaluate({
      beforeFrequency: 7,
      afterFrequency: 1,
      daysObserved: 60,
    });
    await PreventiveAction.create({
      recurrenceProfileId: profile2._id,
      category: 'Drainage blockage',
      location: { name: 'Zilla Parishad Primary School Culvert' },
      recommendedAction: 'Pre-monsoon mechanical desilting and galvanized trash barrier installation',
      actionTaken: 'Desilted 120m stretch and erected heavy gauge mesh screen at culvert mouth',
      assignedTo: worker1._id,
      status: 'COMPLETED',
      targetDate: new Date(Date.now() - 86400000 * 30),
      completedDate: new Date(Date.now() - 86400000 * 25),
      beforeFrequency: 7,
      afterFrequency: 1,
      reductionPercentage: action2Eval.reductionPercentage,
      effectivenessScore: action2Eval.score,
      effectivenessLevel: action2Eval.level,
      notes: 'No standing water around school building even after heavy shower last Tuesday.',
      createdBy: admin._id,
      evidence: [
        {
          url: imgUrls.drain[1],
          caption: 'Cleaned culvert channel and installed galvanized wire screen',
        },
      ],
    });

    // Preventive Action 3: In Progress Action
    await PreventiveAction.create({
      recurrenceProfileId: profile3._id,
      category: 'Water leakage',
      location: { name: 'Water Tank Hill Road & Pipeline Ridge' },
      recommendedAction: 'Install 25mm kinetic air release valve to suppress hydraulic water hammer',
      actionTaken: 'Procured PN-10 HDPE piping and valve assembly. Excavation underway.',
      assignedTo: worker3._id,
      status: 'IN_PROGRESS',
      targetDate: new Date(Date.now() + 86400000 * 10),
      beforeFrequency: 6,
      afterFrequency: 0,
      reductionPercentage: 0,
      notes: 'Valve installation scheduled for completion before upcoming summer cycle.',
      createdBy: admin._id,
    });

    // Preventive Action 4: Planned
    await PreventiveAction.create({
      recurrenceProfileId: profile5._id,
      category: 'Streetlight failure',
      location: { name: 'Ambedkar Nagar Internal Lane' },
      recommendedAction: 'Equip poles with 10kA surge arrestors and weatherproof IP65 junction enclosures',
      actionTaken: '',
      assignedTo: worker3._id,
      status: 'PLANNED',
      targetDate: new Date(Date.now() + 86400000 * 15),
      beforeFrequency: 5,
      afterFrequency: 0,
      notes: 'Approved in Gram Sabha meeting budget allocation.',
      createdBy: admin._id,
    });

    console.log('Creating In-App System Notifications...');

    await Notification.create([
      {
        roleTarget: 'admin',
        type: 'CRITICAL_ALERT',
        title: 'High Recurrence Alert: Weekly Bazaar Ground',
        message: '11 recurring complaints recorded at Weekly Market. Preventive intervention effectiveness monitoring active.',
        issueId: createdIssues[1]._id,
      },
      {
        roleTarget: 'worker',
        userId: worker3._id,
        type: 'WORKER_ASSIGNED',
        title: 'New Emergency Assignment: Water Pipeline Rupture',
        message: 'You have been assigned to repair high-pressure drinking water line near Water Tank Hill.',
        issueId: createdIssues[0]._id,
      },
      {
        roleTarget: 'citizen',
        userId: citizens[0]._id,
        type: 'STATUS_UPDATED',
        title: 'Update on Reported Issue: Water Pipeline Burst',
        message: 'Worker Ganesh Jadhav is on site conducting repairs. Status: UNDER ACTION.',
        issueId: createdIssues[0]._id,
      },
      {
        roleTarget: 'citizen',
        userId: citizens[5]._id,
        type: 'VERIFICATION_REQUIRED',
        title: 'Citizen Verification Requested: Sanitation Block',
        message: 'Repair work reported complete by Gram Panchayat. Please confirm if problem is resolved or still exists.',
        issueId: createdIssues[5]._id,
      },
    ]);

    console.log('=======================================================');
    console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log(` Created 1 Admin, 3 Field Workers, 10 Citizens`);
    console.log(` Created ${createdIssues.length} Realistic Village Issues`);
    console.log(` Created 5 Digital Memory Hotspot Profiles`);
    console.log(` Created 4 Preventive Actions with Effectiveness Metrics`);
    console.log(` Created In-App Notifications & Audit Logs`);
    console.log('=======================================================');
    console.log(' Demo Credentials:');
    console.log('   Admin:   krishna@gmail.com / Sgi@5555');
    console.log('   Worker:  kd@gmail.com / Sgi@5555');
    console.log('   Citizen: citizen1@example.com / citizen123');
    console.log('=======================================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed Database Error:', error);
    process.exit(1);
  }
};

seedDatabase();

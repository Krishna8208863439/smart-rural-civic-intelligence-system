const mongoose = require('mongoose');

// Map mongoose readyState numeric code to human-readable label
const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * Get current database status summary
 */
const getDBStatus = () => {
  const stateCode = mongoose.connection.readyState;
  return {
    state: READY_STATES[stateCode] || 'unknown',
    readyState: stateCode,
    isConnected: stateCode === 1,
    host: mongoose.connection.host || 'unknown',
    port: mongoose.connection.port || null,
    name: mongoose.connection.name || 'unknown',
  };
};

/**
 * Connect to MongoDB with automatic retry and event listeners
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/srci_db';
  const isAtlas = mongoUri.startsWith('mongodb+srv://');

  console.log(`[MongoDB] Initializing database connection...`);
  console.log(`[MongoDB] Target URI: ${isAtlas ? mongoUri.replace(/:([^:@]{3})[^:@]*@/, ':***@') : mongoUri}`);

  // Connection options optimized for local & Atlas
  const options = {
    serverSelectionTimeoutMS: 10000,
    autoIndex: true,
  };

  // Only apply IPv4 constraint on local connections to prevent Windows dual-stack latency
  if (!isAtlas && (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1'))) {
    options.family = 4;
  }

  // Set up connection event listeners once
  if (mongoose.connection.listenerCount('connected') === 0) {
    mongoose.connection.on('connected', () => {
      console.log(`[MongoDB] Event: Connection established to ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Event Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`[MongoDB] Event: Database disconnected`);
    });

    mongoose.connection.on('reconnected', () => {
      console.log(`[MongoDB] Event: Database reconnected successfully`);
    });
  }

  try {
    const conn = await mongoose.connect(mongoUri, options);
    console.log(`=======================================================`);
    console.log(` MongoDB Connected Successfully!`);
    console.log(` Host:     ${conn.connection.host}`);
    console.log(` Port:     ${conn.connection.port || 'default (Atlas)'}`);
    console.log(` Database: ${conn.connection.name}`);
    console.log(` Ready:    ${READY_STATES[conn.connection.readyState]}`);
    console.log(`=======================================================`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Initial connection failed: ${error.message}`);
    console.log(`[MongoDB] Attempting retry in 3 seconds...`);

    // Retry once with extended timeout
    try {
      await new Promise((res) => setTimeout(res, 3000));
      const conn = await mongoose.connect(mongoUri, {
        ...options,
        serverSelectionTimeoutMS: 15000,
      });
      console.log(`[MongoDB] Successfully connected on retry: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (retryErr) {
      console.error(`[MongoDB] Retry connection also failed: ${retryErr.message}`);
      console.warn(`[MongoDB] Tip: Verify your MONGODB_URI in backend/.env or ensure MongoDB service is active.`);
      // Return null so server can still boot up in development
      return null;
    }
  }
};

/**
 * Cleanly disconnect database
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close(false);
    console.log('[MongoDB] Connection cleanly closed.');
  } catch (err) {
    console.error(`[MongoDB] Error during disconnect: ${err.message}`);
  }
};

module.exports = {
  connectDB,
  getDBStatus,
  disconnectDB,
};

// Load environment variables BEFORE any other imports
import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });
console.log(`✓ Loaded env from: ${envFile}`);

// Debug: Log environment variables after dotenv loads
console.log('========== ENVIRONMENT DEBUG ==========');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT);
console.log('=======================================');

import app from './app';
import prisma from './config/database';

const PORT = process.env.PORT || 3007;

// Test database connection
const startServer = async () => {
  try {
    // Test Prisma connection
    await prisma.$connect();
    console.log('✓ Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

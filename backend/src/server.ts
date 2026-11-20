import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { MigrationRunner } from './infrastructure/database/migration-runner.js';
import { seedDatabase } from './infrastructure/database/seed.js';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function bootstrap() {
  try {
    console.log('Running database migrations...');
    await MigrationRunner.runUp();

    // Auto-seed if specified or first run
    if (process.env.AUTO_SEED === 'true' || process.env.NODE_ENV !== 'production') {
      console.log('Seeding initial baseline data...');
      await seedDatabase();
    }

    const app = createApp();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 HabitPulse Backend API listening on http://0.0.0.0:${PORT}`);
      console.log(`📡 Health Check: http://0.0.0.0:${PORT}/health`);
      console.log(`📚 REST Endpoints: http://0.0.0.0:${PORT}/api/v1`);
    });
  } catch (err) {
    console.error('Fatal bootstrap error:', err);
    process.exit(1);
  }
}

bootstrap();

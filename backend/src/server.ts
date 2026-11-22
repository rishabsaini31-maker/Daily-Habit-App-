import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { MigrationRunner } from './infrastructure/database/migration-runner.js';
import { seedDatabase } from './infrastructure/database/seed.js';
import { PgConnection } from './infrastructure/database/pg-connection.js';
import { RenderKeepAliveService } from './infrastructure/keep-alive/render-keep-alive.service.js';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function bootstrap() {
  try {
    const isPostgres =
      process.env.DATABASE_URL?.startsWith('postgres://') ||
      process.env.DATABASE_URL?.startsWith('postgresql://');

    if (isPostgres) {
      console.log('Testing Supabase PostgreSQL pool connection...');
      const connected = await PgConnection.testConnection();
      if (connected) {
        console.log('✅ Connected to Supabase PostgreSQL at aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres');
      } else {
        console.warn('⚠️ PostgreSQL connection test returned false');
      }
    }

    console.log('Running database migrations...');
    await MigrationRunner.runUp();

    // Auto-seed if specified or first run (SQLite only)
    if (!isPostgres && (process.env.AUTO_SEED === 'true' || process.env.NODE_ENV !== 'production')) {
      console.log('Seeding initial baseline data...');
      await seedDatabase();
    }

    const app = createApp();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 HabitPulse Backend API listening on http://0.0.0.0:${PORT}`);
      console.log(`📡 Health Check: http://0.0.0.0:${PORT}/health`);
      console.log(`📚 REST Endpoints: http://0.0.0.0:${PORT}/api/v1`);

      // Keep Render Free Tier alive (pings /health every 10 mins to prevent sleep)
      RenderKeepAliveService.start(10);
    });
  } catch (err) {
    console.error('Fatal bootstrap error:', err);
    process.exit(1);
  }
}

bootstrap();

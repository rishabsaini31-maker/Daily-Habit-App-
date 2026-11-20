import { MigrationRunner } from './migration-runner.js';

async function main() {
  const direction = process.argv[2] || 'up';
  try {
    if (direction === 'down') {
      await MigrationRunner.runDown();
    } else {
      await MigrationRunner.runUp();
    }
    console.log(`Migration ${direction} completed successfully.`);
    process.exit(0);
  } catch (err) {
    console.error(`Migration error:`, err);
    process.exit(1);
  }
}

main();

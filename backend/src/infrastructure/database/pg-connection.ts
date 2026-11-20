import pg from 'pg';
const { Pool } = pg;

export class PgConnection {
  private static pool: pg.Pool | null = null;

  public static getPool(): pg.Pool {
    if (!PgConnection.pool) {
      const connectionString = process.env.DATABASE_URL;

      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is required for PostgreSQL connection');
      }

      PgConnection.pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      PgConnection.pool.on('error', (err) => {
        console.error('Unexpected idle client error in PostgreSQL pool:', err);
      });
    }

    return PgConnection.pool;
  }

  public static async query<T extends pg.QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<pg.QueryResult<T>> {
    const pool = PgConnection.getPool();
    return await pool.query<T>(text, params);
  }

  public static async testConnection(): Promise<boolean> {
    try {
      const res = await PgConnection.query('SELECT 1 as connected, NOW() as server_time');
      return res.rows.length > 0 && res.rows[0].connected === 1;
    } catch (err) {
      console.error('PostgreSQL connection check failed:', err);
      return false;
    }
  }

  public static async close(): Promise<void> {
    if (PgConnection.pool) {
      await PgConnection.pool.end();
      PgConnection.pool = null;
    }
  }
}

export default PgConnection;

import { Pool, PoolConfig } from 'pg';
import { env } from './env';

const poolConfig: PoolConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

class Database {
  private static instance: Database;
  public pool: Pool;

  private constructor() {
    this.pool = new Pool(poolConfig);

    this.pool.on('connect', () => {
      console.log('✅ Nouvelle connexion PostgreSQL établie');
    });

    this.pool.on('error', (err) => {
      console.error('❌ Erreur inattendue du pool PostgreSQL:', err);
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (env.IS_DEV) {
        console.log(`🟢 Requête exécutée | ${duration}ms | ${text.substring(0, 80)}...`);
      }
      
      return result;
    } catch (error) {
      console.error(`🔴 Erreur requête | ${text.substring(0, 80)}...`, error);
      throw error;
    }
  }

  public async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

export const db = Database.getInstance();

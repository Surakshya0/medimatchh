import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool as NodePool } from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if we're using Neon or local PostgreSQL
const isNeon = process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('neon.');

const MAX_RETRIES = 15;
const RETRY_DELAY_BASE = 2000;
const MAX_RETRY_DELAY = 30000;
const PING_INTERVAL = 30000;
const RECONNECT_INTERVAL = 5000;

// Track connection state
let isConnected = false;
let reconnectTimer: NodeJS.Timeout | null = null;
let pingInterval: NodeJS.Timeout | null = null;

// Use exponential backoff for reconnection attempts
function getRetryDelay(attempt: number): number {
  const delay = Math.min(
    RETRY_DELAY_BASE * Math.pow(1.5, attempt), 
    MAX_RETRY_DELAY
  );
  return delay + Math.random() * 1000;
}

// Create pool configuration based on database type
const createPoolConfig = () => {
  if (isNeon) {
    // Configure Neon to use WebSockets
    neonConfig.webSocketConstructor = ws;
    neonConfig.useSecureWebSocket = true;
    
    return {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
    };
  } else {
    // Local PostgreSQL configuration
    return {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
      // Additional settings for local PostgreSQL
      ssl: false, // Typically no SSL for local development
    };
  }
};

// Ping database to check connection
async function pingDatabase(pool: Pool | NodePool): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database ping failed:', error);
    return false;
  }
}

// Setup periodic health checks
function setupHealthChecks(pool: Pool | NodePool) {
  if (pingInterval) {
    clearInterval(pingInterval);
  }
  
  pingInterval = setInterval(async () => {
    const isHealthy = await pingDatabase(pool);
    
    if (isConnected && !isHealthy) {
      console.log('Database connection lost, attempting to reconnect...');
      isConnected = false;
      tryReconnect();
    } else if (!isConnected && isHealthy) {
      console.log('Database connection restored');
      isConnected = true;
    }
  }, PING_INTERVAL);
}

// Reconnection logic
function tryReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  
  reconnectTimer = setTimeout(async () => {
    try {
      console.log('Attempting to reconnect to database...');
      const newPool = await createPool();
      
      // Replace global instances if successful
      if (pool) {
        try {
          await pool.end();
        } catch (e) {
          console.error('Error closing old pool:', e);
        }
      }
      
      poolInstance = newPool.pool;
      exportedPool = newPool.pool;
      exportedDb = newPool.db;
      
      isConnected = true;
      console.log('Successfully reconnected to database');
    } catch (error) {
      console.error('Failed to reconnect to database:', error);
      isConnected = false;
      tryReconnect();
    }
  }, RECONNECT_INTERVAL);
}

async function createPool(retries = MAX_RETRIES, attempt = 0): Promise<{pool: Pool | NodePool, db: any}> {
  try {
    const poolConfig = createPoolConfig();
    let pool: Pool | NodePool;
    let db: any;
    
    if (isNeon) {
      console.log('Connecting to Neon database...');
      pool = new Pool(poolConfig);
      db = drizzle(pool, { schema });
    } else {
      console.log('Connecting to local PostgreSQL database...');
      pool = new NodePool(poolConfig);
      db = drizzleNode(pool, { schema });
    }
    
    // Test the connection
    await pool.connect();
    console.log(`Database connected successfully (${isNeon ? 'Neon' : 'Local PostgreSQL'})`);
    isConnected = true;
    
    // Setup health checks
    setupHealthChecks(pool);
    
    // Handle errors on the pool
    if (pool instanceof NodePool) {
      pool.on('error', (err) => {
        console.error('Unexpected database error:', err);
        if (isConnected) {
          isConnected = false;
          tryReconnect();
        }
      });
    }
    
    return { pool, db };
  } catch (error) {
    if (retries > 0) {
      const delay = getRetryDelay(attempt);
      console.log(`Database connection failed, retrying in ${Math.round(delay/1000)}s... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return createPool(retries - 1, attempt + 1);
    }
    
    console.error('All database connection attempts failed.');
    throw error;
  }
}

// Create pool with retries
let poolInstance: Pool | NodePool;
let dbInstance: any;
try {
  const { pool, db } = await createPool();
  poolInstance = pool;
  dbInstance = db;
} catch (error) {
  console.error('Failed to create database pool, using fallback data:', error);
  
  // Create a dummy pool based on the database type
  const poolConfig = createPoolConfig();
  if (isNeon) {
    poolInstance = new Pool(poolConfig);
    dbInstance = drizzle(poolInstance, { schema });
  } else {
    poolInstance = new NodePool(poolConfig);
    dbInstance = drizzleNode(poolInstance, { schema });
  }
  
  // Start reconnection attempts in background
  setTimeout(() => tryReconnect(), RECONNECT_INTERVAL);
}

// Export mutable references to allow for reconnection
let exportedPool = poolInstance;
let exportedDb = dbInstance;

export const pool = exportedPool;
export const db = exportedDb;

// Handle global unhandled rejections more gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Check if this is a database connection error
  const reasonStr = String(reason);
  if (reasonStr.includes('database') || 
      reasonStr.includes('connection') || 
      reasonStr.includes('sql') ||
      reasonStr.includes('neon')) {
    console.log('Database-related rejection detected, attempting to reconnect...');
    if (isConnected) {
      isConnected = false;
      tryReconnect();
    }
  }
  
  // Don't exit the process for database errors, but let other errors propagate
  if (!reasonStr.includes('database') && 
      !reasonStr.includes('connection') && 
      !reasonStr.includes('sql') &&
      !reasonStr.includes('neon')) {
    console.error('Non-database critical error, reporting to monitoring system');
  }
});
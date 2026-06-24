#!/usr/bin/env node

/**
 * PostgreSQL Database Setup Script
 * Uses pg library to execute SQL schema directly
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTGRES_URL = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
const SQL_FILE = path.join(__dirname, 'supabase', 'full_setup.sql');

if (!POSTGRES_URL) {
  console.error('❌ Missing POSTGRES_URL environment variable');
  process.exit(1);
}

if (!fs.existsSync(SQL_FILE)) {
  console.error('❌ SQL file not found:', SQL_FILE);
  process.exit(1);
}

async function setupDatabase() {
  // Build connection config with SSL options
  const connectionUrl = new URL(POSTGRES_URL);
  connectionUrl.searchParams.set('sslmode', 'require');
  
  const client = new Client({
    connectionString: connectionUrl.toString(),
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🚀 Starting database setup...\n');
    console.log('🔌 Connecting to database...');
    
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read SQL file
    console.log('📋 Reading SQL schema...');
    const sql = fs.readFileSync(SQL_FILE, 'utf-8');
    console.log('✓ SQL schema loaded\n');

    // Execute schema
    console.log('📊 Executing schema setup...');
    try {
      await client.query(sql);
      console.log('✓ Schema created successfully\n');
    } catch (error) {
      console.error('⚠️  Schema execution had warnings/errors:');
      console.error('   ', error.message);
      console.log('   (This may be normal if tables already exist)\n');
    }

    // Test connectivity
    console.log('🧪 Testing connectivity...');
    const result = await client.query('SELECT COUNT(*) FROM public.products;');
    const productCount = result.rows[0]?.count || 0;
    console.log(`✅ Connectivity test passed!`);
    console.log(`📋 Found ${productCount} products in database\n`);

    // Fetch sample data
    const categories = await client.query('SELECT COUNT(*) FROM public.categories;');
    const categoryCount = categories.rows[0]?.count || 0;
    console.log(`📊 Summary:`);
    console.log(`   ✓ ${categoryCount} categories`);
    console.log(`   ✓ ${productCount} products`);

    console.log('\n✅ Database setup complete!\n');
    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

setupDatabase().then(success => {
  process.exit(success ? 0 : 1);
});

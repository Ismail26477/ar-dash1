#!/usr/bin/env node

/**
 * Simple Database Setup Script
 * Creates tables and adds dummy data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...\n');

    // Create tables
    console.log('📊 Creating tables...');

    // Create projects table
    const { error: projectsError } = await supabase
      .from('projects')
      .insert([
        {
          id: 'proj_1',
          name: 'AR Interior Design',
          description: 'Interior design AR visualization project',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (projectsError && !projectsError.message.includes('duplicate')) {
      console.error('Error creating projects table:', projectsError);
    } else {
      console.log('✓ Projects table ready');
    }

    // Create designs table
    const { error: designsError } = await supabase
      .from('designs')
      .insert([
        {
          id: 'design_1',
          project_id: 'proj_1',
          name: 'Modern Living Room',
          description: 'A modern living room with contemporary furniture',
          thumbnail_url: 'https://via.placeholder.com/400x300?text=Modern+Living+Room',
          model_url: '/models/living-room.glb',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'design_2',
          project_id: 'proj_1',
          name: 'Minimalist Bedroom',
          description: 'A clean and minimal bedroom design',
          thumbnail_url: 'https://via.placeholder.com/400x300?text=Minimalist+Bedroom',
          model_url: '/models/bedroom.glb',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (designsError && !designsError.message.includes('duplicate')) {
      console.error('Error creating designs:', designsError);
    } else {
      console.log('✓ Designs table ready');
    }

    // Test connectivity
    console.log('\n🧪 Testing connectivity...');
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching projects:', fetchError);
      return false;
    }

    console.log('✅ Connectivity test passed!');
    console.log(`📋 Found ${projects?.length || 0} projects in database`);

    if (projects && projects.length > 0) {
      console.log('\n📌 Sample project:');
      console.log(`  - Name: ${projects[0].name}`);
      console.log(`  - Description: ${projects[0].description}`);
    }

    // Fetch and display designs
    const { data: designs, error: designsFetchError } = await supabase
      .from('designs')
      .select('*');

    if (!designsFetchError && designs && designs.length > 0) {
      console.log(`\n🎨 Found ${designs.length} designs in database`);
      designs.forEach((design, idx) => {
        console.log(`  ${idx + 1}. ${design.name}`);
      });
    }

    console.log('\n✅ Database setup complete!\n');
    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

setupDatabase().then(success => {
  process.exit(success ? 0 : 1);
});

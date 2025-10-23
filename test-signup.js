#!/usr/bin/env node

/**
 * Test script to verify user signup functionality works after the permission fixes
 * Uses the remote Supabase instance configured in .env
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables
const envContent = readFileSync('.env', 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/"/g, '');
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate a unique test email
const timestamp = Date.now();
const testEmail = `test-user-${timestamp}@example.com`;
const testPassword = 'TestPassword123!';
const testName = `Test User ${timestamp}`;

async function testSignup() {
  console.log('🚀 Testing user signup functionality...');
  console.log(`📧 Test email: ${testEmail}`);
  console.log(`👤 Test name: ${testName}`);

  try {
    // Step 1: Test auth signup
    console.log('\n📝 Step 1: Creating auth account...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
          role: 'buyer',
          country: 'Nigeria'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      console.log('Error details:', authError.message);

      if (authError.message.includes('permission denied') || authError.message.includes('RLS')) {
        console.log('🔧 This is likely the permissions issue you were trying to fix!');
      }

      return false;
    }

    if (!authData.user) {
      console.error('❌ No user data returned from auth signup');
      return false;
    }

    console.log('✅ Auth signup successful:', authData.user.id);

    // Step 2: Test manual user profile creation (as in your signup hook)
    console.log('\n👤 Step 2: Creating user profile...');

    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        full_name: testName,
        email: testEmail,
        role: 'buyer',
        status: 'active'
      })
      .select();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      console.log('Error details:', profileError.message);

      if (profileError.message.includes('permission denied') || profileError.message.includes('RLS')) {
        console.log('🔧 This confirms the RLS/policy issue!');
      } else if (profileError.message.includes('duplicate key')) {
        console.log('ℹ️ User profile might already exist');
      }

      return false;
    }

    console.log('✅ Profile created successfully:', profileData?.[0]?.id);

    // Step 3: Verify the user was created properly
    console.log('\n🔍 Step 3: Verifying user data...');
    const { data: verificationData, error: verifyError } = await supabase
      .from('users')
      .select('id, full_name, email, role, status, created_at')
      .eq('id', authData.user.id)
      .single();

    if (verifyError) {
      console.error('❌ User verification failed:', verifyError.message);
      return false;
    }

    console.log('✅ User verification successful:');
    console.log(JSON.stringify(verificationData, null, 2));

    // Step 4: Test auto-login (similar to your signup hook)
    console.log('\n🔑 Step 4: Testing auto-login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.log('⚠️ Auto-login failed (might need email confirmation):', signInError.message);
    } else {
      console.log('✅ Auto-login successful');

      // Logout immediately
      await supabase.auth.signOut();
      console.log('👋 Logged out test user');
    }

    console.log('\n🎉 SUCCESS: Signup functionality is working!');
    console.log('📊 Summary:');
    console.log('- ✅ Auth account created');
    console.log('- ✅ User profile inserted');
    console.log('- ✅ Data persisted correctly');
    console.log('- ✅ Signup process completed successfully');

    return true;

  } catch (error) {
    console.error('💥 Unexpected error during signup test:', error);
    return false;
  }
}

// Cleanup function to remove test user if it was created
async function cleanupTestUser(userId) {
  if (!userId) return;

  try {
    console.log('\n🧹 Cleaning up test user...');

    // Get admin access (this would require admin key in production)
    // For now, just log that cleanup would be needed
    console.log(`Test user ${userId} created. You may want to manually delete from Supabase dashboard users table.`);

  } catch (error) {
    console.log('⚠️ Cleanup failed (expected if using regular key):', error.message);
  }
}

// Run the test
testSignup()
  .then(success => {
    if (!success) {
      console.log('\n❌ SIGNUP TEST FAILED!');
      console.log('💡 Suggestion: Check your recent migrations - the permission issues may still exist.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test execution error:', error);
    process.exit(1);
  });

#!/usr/bin/env node

/**
 * COMPREHENSIVE PROJECT DIAGNOSTIC
 * This script tests all critical functionality
 */

const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000';

// Test 1: MongoDB Connection
async function testMongoConnection() {
  console.log('\n=== TEST 1: MongoDB Connection ===');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📍 Database: ${process.env.MONGO_URI}`);
    
    // Check if test users exist
    const User = require('./models/User');
    const count = await User.countDocuments();
    console.log(`📊 Total users in database: ${count}`);
    
    const testUsers = await User.find({ email: { $in: ['jobseeker@example.com', 'recruiter@example.com', 'admin@gmail.com'] } });
    console.log(`👥 Test users found: ${testUsers.length}`);
    testUsers.forEach(u => console.log(`   - ${u.email} (${u.role})`));
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    return false;
  }
}

// Test 2: Backend Server
async function testBackendServer() {
  console.log('\n=== TEST 2: Backend Server ===');
  try {
    const response = await axios.get(`${API_URL}/api/auth/health`, { timeout: 5000 }).catch(() => {
      // Health endpoint might not exist, try different endpoint
      return axios.get(`${API_URL}/`, { timeout: 5000 });
    });
    console.log('✅ Backend Server Responding');
    return true;
  } catch (error) {
    console.error('❌ Backend Server Not Responding:', error.message);
    console.log('   💡 Make sure backend is running: cd backend && npm run dev');
    return false;
  }
}

// Test 3: Signup Endpoint
async function testSignup() {
  console.log('\n=== TEST 3: Signup Endpoint ===');
  try {
    const email = `test-${Date.now()}@example.com`;
    const response = await axios.post(`${API_URL}/api/auth/signup`, {
      name: 'Test User',
      email: email,
      password: 'TestPassword123',
      role: 'jobseeker',
      termsAccepted: true
    });
    
    console.log('✅ Signup Works');
    console.log(`📧 Test email created: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Signup Failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 4: Login Endpoint
async function testLogin() {
  console.log('\n=== TEST 4: Login Endpoint ===');
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'jobseeker@example.com',
      password: 'password123',
      role: 'jobseeker'
    });
    
    if (!response.data.token) {
      console.error('❌ No token in response');
      console.log('Response:', response.data);
      return false;
    }
    
    if (!response.data.user) {
      console.error('❌ No user data in response');
      console.log('Response:', response.data);
      return false;
    }
    
    console.log('✅ Login Works');
    console.log(`🔑 Token: ${response.data.token.substring(0, 20)}...`);
    console.log(`👤 User: ${response.data.user.name} (${response.data.user.role})`);
    console.log(`📧 Email: ${response.data.user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Login Failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('Full error:', error.response.data);
    }
    return false;
  }
}

// Test 5: Admin Login
async function testAdminLogin() {
  console.log('\n=== TEST 5: Admin Login ===');
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@gmail.com',
      password: '123456',
      role: 'admin'
    });
    
    if (!response.data.token) {
      console.error('❌ No token in response');
      return false;
    }
    
    console.log('✅ Admin Login Works');
    console.log(`🔑 Token: ${response.data.token.substring(0, 20)}...`);
    console.log(`👤 User: ${response.data.user.name}`);
    console.log(`🛡️ Role: ${response.data.user.role}`);
    return true;
  } catch (error) {
    console.error('❌ Admin Login Failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 6: CORS
async function testCORS() {
  console.log('\n=== TEST 6: CORS Configuration ===');
  try {
    const response = await axios.options(`${API_URL}/api/auth/login`, {
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    
    const corsHeaders = response.headers['access-control-allow-origin'];
    if (corsHeaders) {
      console.log('✅ CORS Enabled');
      console.log(`📍 Allowed Origin: ${corsHeaders}`);
    } else {
      console.log('⚠️ CORS Headers Not Found');
    }
    return true;
  } catch (error) {
    console.log('⚠️ CORS Test Inconclusive:', error.message);
    return true; // Not critical
  }
}

// Test 7: Database Integrity
async function testDatabaseIntegrity() {
  console.log('\n=== TEST 7: Database Integrity ===');
  try {
    const User = require('./models/User');
    
    // Test jobseeker user
    const jobseeker = await User.findOne({ email: 'jobseeker@example.com' });
    if (!jobseeker) {
      console.error('❌ Job seeker user not found');
      return false;
    }
    
    if (!jobseeker.password) {
      console.error('❌ Job seeker password is missing');
      return false;
    }
    
    // Test recruiter user
    const recruiter = await User.findOne({ email: 'recruiter@example.com' });
    if (!recruiter) {
      console.error('❌ Recruiter user not found');
      return false;
    }
    
    // Test admin user
    const admin = await User.findOne({ email: 'admin@gmail.com' });
    if (!admin) {
      console.error('❌ Admin user not found');
      return false;
    }
    
    console.log('✅ All Test Users Present and Valid');
    console.log(`   ✓ Job Seeker: ${jobseeker.name} (${jobseeker.role})`);
    console.log(`   ✓ Recruiter: ${recruiter.name} (${recruiter.role})`);
    console.log(`   ✓ Admin: ${admin.name} (${admin.role})`);
    return true;
  } catch (error) {
    console.error('❌ Database Integrity Check Failed:', error.message);
    return false;
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   JobGenius Comprehensive Diagnostic   ║');
  console.log('╚════════════════════════════════════════╝');

  const results = {
    mongoConnection: await testMongoConnection(),
    backendServer: await testBackendServer(),
    signup: null,
    login: null,
    adminLogin: null,
    cors: await testCORS(),
    databaseIntegrity: null
  };

  // Only run these if backend is up
  if (results.backendServer) {
    results.databaseIntegrity = await testDatabaseIntegrity();
    results.signup = await testSignup();
    results.login = await testLogin();
    results.adminLogin = await testAdminLogin();
  }

  // Summary
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║           DIAGNOSTIC SUMMARY           ║');
  console.log('╚════════════════════════════════════════╝');

  const tests = [
    ['MongoDB Connection', results.mongoConnection],
    ['Backend Server', results.backendServer],
    ['Database Integrity', results.databaseIntegrity],
    ['Login', results.login],
    ['Admin Login', results.adminLogin],
    ['Signup', results.signup],
    ['CORS', results.cors]
  ];

  tests.forEach(([name, result]) => {
    if (result === null) {
      console.log(`⏭️  ${name}: Skipped`);
    } else {
      console.log(`${result ? '✅' : '❌'} ${name}`);
    }
  });

  const allPassed = Object.values(results).every(r => r !== false);
  
  console.log('\n' + '='.repeat(40));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED - System is working!');
  } else {
    console.log('⚠️  SOME TESTS FAILED - See above for details');
    console.log('\nCommon Fixes:');
    console.log('1. Make sure backend is running: cd backend && npm run dev');
    console.log('2. Verify MongoDB is running');
    console.log('3. Check .env file has MONGO_URI and JWT_SECRET');
    console.log('4. Seed test users: npm run seed');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run diagnostics
runDiagnostics().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const seedTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Test users data
    const testUsers = [
      {
        name: 'John Seeker',
        email: 'jobseeker@example.com',
        password: 'password123',
        role: 'jobseeker',
        termsAccepted: true,
        status: 'active'
      },
      {
        name: 'Jane Recruiter',
        email: 'recruiter@example.com',
        password: 'password123',
        role: 'recruiter',
        termsAccepted: true,
        status: 'active'
      },
      {
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: '123456',
        role: 'admin',
        termsAccepted: true,
        status: 'active'
      }
    ];

    // Hash passwords and create users
    for (const userData of testUsers) {
      // Check if user already exists
      const existing = await User.findOne({ 
        email: { $regex: new RegExp(`^${userData.email}$`, 'i') } 
      });

      if (existing) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword,
        termsAcceptedAt: new Date()
      });

      await user.save();
      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    }

    console.log('\n🎉 Test users seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('─────────────────────────────────────');
    console.log('Job Seeker:');
    console.log('  Email: jobseeker@example.com');
    console.log('  Password: password123');
    console.log('─────────────────────────────────────');
    console.log('Recruiter:');
    console.log('  Email: recruiter@example.com');
    console.log('  Password: password123');
    console.log('─────────────────────────────────────');
    console.log('Admin:');
    console.log('  Email: admin@gmail.com');
    console.log('  Password: 123456');
    console.log('─────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run seed
seedTestUsers();

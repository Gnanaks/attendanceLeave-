require('dotenv').config({ path: './.env' });

const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);

const User = require('./models/User');

const seeds = [
  { name: 'Super Admin', email: 'admin@attendx.com', password: 'admin123', role: 'admin', department: 'Management' },
  { name: 'Alice Manager', email: 'manager@attendx.com', password: 'manager123', role: 'manager', department: 'Engineering', employeeId: 'MGR001' },
  { name: 'Bob Teacher', email: 'teacher@attendx.com', password: 'teacher123', role: 'teacher', department: 'Science', employeeId: 'TCH001' },
  { name: 'Carol Employee', email: 'employee@attendx.com', password: 'employee123', role: 'employee', department: 'Engineering', employeeId: 'EMP001' },
  { name: 'Dave Student', email: 'student@attendx.com', password: 'student123', role: 'student', department: 'Science', rollNumber: 'R001' },
];

async function seed() {
  try {
    console.log('Connecting to:', process.env.MONGO_URI);

    // ✅ 1. CONNECT FIRST
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ✅ 2. THEN load model
    const User = require('./models/User');

    // ✅ 3. WAIT for connection to be fully ready
    await mongoose.connection.asPromise();

    // ✅ 4. THEN run queries
    await User.deleteMany({});
    console.log('🗑 Cleared users');

    const created = await User.create(seeds);
    console.log(`✅ Created ${created.length} users`);

    process.exit(0);
  } catch (err) {
    console.error('❌ FINAL error:', err);
    process.exit(1);
  }
}

seed();
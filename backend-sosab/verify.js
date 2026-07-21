/**
 * Integration Verification Script for Attendance System API
 * Run this script to test all REST endpoints end-to-end with Admin & Gerant roles.
 */

const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

const TEST_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@company.com';
const TEST_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminSecurePassword123!';

const TEST_GERANT_EMAIL = 'verify.gerant@company.com';
const TEST_GERANT_PASSWORD = 'GerantVerifyPassword123!';

// Simple assertion helper
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ ${message}`);
}

async function runTests() {
  console.log('\n==================================================');
  console.log('🚀 STARTING END-TO-END API INTEGRATION VERIFICATION (GERANT ROLE)');
  console.log('==================================================\n');

  let adminToken = '';
  let gerantToken = '';
  let workerIds = [];
  
  // Randomize day in July 2026 to isolate this test run from previous database entries
  const randomDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const testDate = `2026-07-${randomDay}`;
  console.log(`Using randomized date for this test run: ${testDate}\n`);

  // 1. Check health
  console.log('Step 1: Verifying Health Check...');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    assert(res.status === 200, 'Health check status is 200');
    assert(data.success === true, 'Health check returns success: true');
  } catch (err) {
    console.error('❌ Could not connect to server. Please ensure the server is running on port ' + PORT);
    console.error('Run "npm run dev" or "node server.js" in another terminal before running this script.');
    process.exit(1);
  }

  // 2. Admin Login
  console.log('\nStep 2: Testing Admin Login...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, 'Admin login status is 200');
  assert(loginData.token !== undefined, 'Admin login returned JWT token');
  assert(loginData.user.role === 'admin', 'Logged in user has role "admin"');
  adminToken = loginData.token;

  // 3. Register a Gerant (Manager)
  console.log('\nStep 3: Registering a Gerant account (Admin only)...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Verification Gerant',
      email: TEST_GERANT_EMAIL,
      password: TEST_GERANT_PASSWORD,
      role: 'gerant',
    }),
  });
  const regData = await regRes.json();
  if (regRes.status === 400 && regData.error.includes('already exists')) {
    console.log('  ⚠️ Test gerant already exists, proceeding to login...');
  } else {
    assert(regRes.status === 201, 'Gerant registered with status 201');
    assert(regData.success === true, 'Registration success matches');
    assert(regData.data.role === 'gerant', 'Registered user has role "gerant"');
  }

  // 4. Gerant Login
  console.log('\nStep 4: Testing Gerant Login...');
  const gerantLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_GERANT_EMAIL, password: TEST_GERANT_PASSWORD }),
  });
  const gerantLoginData = await gerantLoginRes.json();
  assert(gerantLoginRes.status === 200, 'Gerant login status is 200');
  assert(gerantLoginData.token !== undefined, 'Gerant login returned JWT token');
  assert(gerantLoginData.user.role === 'gerant', 'Logged in user has role "gerant"');
  gerantToken = gerantLoginData.token;

  // 5. Create Workers (Admin Only)
  console.log('\nStep 5: Creating Workers (Admin only)...');
  const workersToCreate = [
    { name: 'John Doe', phone: '+1234567890', jobRole: 'Brickmason' },
    { name: 'Alice Smith', phone: '+1987654321', jobRole: 'Electrician' },
    { name: 'Bob Johnson', phone: '+1555555555', jobRole: 'Carpenter' },
  ];

  for (const worker of workersToCreate) {
    const workerRes = await fetch(`${BASE_URL}/workers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(worker),
    });
    const workerData = await workerRes.json();
    if (workerRes.status === 400 && workerData.error && workerData.error.includes('already registered')) {
      console.log(`  ⚠️ Worker '${worker.name}' is already registered, fetching existing record...`);
      // Fetch workers to retrieve the existing ID
      const getWorkersRes = await fetch(`${BASE_URL}/workers`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      const getWorkersData = await getWorkersRes.json();
      const existing = getWorkersData.data.find(w => w.phone === worker.phone);
      assert(existing !== undefined, `Found existing worker record for '${worker.name}'`);
      workerIds.push(existing._id);
    } else {
      assert(workerRes.status === 201, `Worker '${worker.name}' created with status 201`);
      workerIds.push(workerData.data._id);
    }
  }

  // Optional: Clean up any historical attendance records for these 3 workers to ensure pristine test metrics
  try {
    const mongoose = require('mongoose');
    const Attendance = require('./models/Attendance');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sosab_attendance');
    }
    await Attendance.deleteMany({ workerId: { $in: workerIds } });
    console.log('  🧹 Cleaned up historical attendance logs for test workers.');
  } catch (dbErr) {
    console.log('  ⚠️ Database cleanup warning (skipping):', dbErr.message);
  }

  // 6. Verify Role Guarding (Gerant cannot create worker)
  console.log('\nStep 6: Verifying Role Authorization (Gerant trying to create a worker)...');
  const failWorkerRes = await fetch(`${BASE_URL}/workers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${gerantToken}`,
    },
    body: JSON.stringify({ name: 'Imposter', phone: '000', jobRole: 'None' }),
  });
  const failWorkerData = await failWorkerRes.json();
  assert(failWorkerRes.status === 403, 'Request rejected with status 403 Forbidden');
  assert(failWorkerData.success === false, 'Response indicates failure');
  assert(failWorkerData.error.includes('not authorized'), 'Error message states unauthorized role');

  // 7. Get Workers list (Both Gerant & Admin can access)
  console.log('\nStep 7: Retrieving Workers list (Gerant access)...');
  const getWorkersRes = await fetch(`${BASE_URL}/workers`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${gerantToken}` },
  });
  const getWorkersData = await getWorkersRes.json();
  assert(getWorkersRes.status === 200, 'Workers list retrieved with status 200');
  assert(getWorkersData.count >= 3, 'Workers list contains at least the 3 created workers');

  // 8. Verify Role Guarding (Gerant cannot mark attendance)
  console.log('\nStep 8: Verifying Role Authorization (Gerant trying to mark attendance)...');
  const failMarkRes = await fetch(`${BASE_URL}/attendance/mark`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${gerantToken}`,
    },
    body: JSON.stringify({
      date: testDate,
      records: [{ workerId: workerIds[0], status: 'present' }],
    }),
  });
  const failMarkData = await failMarkRes.json();
  assert(failMarkRes.status === 403, 'Request rejected with status 403 Forbidden');
  assert(failMarkData.success === false, 'Response indicates failure');

  // 9. Admin Marks Attendance
  console.log('\nStep 9: Marking Daily Attendance (Admin)...');
  const attendancePayload = {
    date: testDate,
    records: [
      { workerId: workerIds[0], status: 'present', notes: 'Arrived on time' },
      { workerId: workerIds[1], status: 'late', notes: '15 mins late, transit' },
      { workerId: workerIds[2], status: 'absent', notes: 'Unexcused absence' },
    ],
  };

  const markRes = await fetch(`${BASE_URL}/attendance/mark`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify(attendancePayload),
  });
  const markData = await markRes.json();
  assert(markRes.status === 200, 'Attendance marked with status 200');
  assert(markData.success === true, 'Attendance marking response success');
  assert(markData.summary.upsertedCount > 0 || markData.summary.matchedCount > 0, 'Database upsert recorded entries');

  // 10. Verify Attendance Upsert (Admin updating worker status)
  console.log('\nStep 10: Verifying Attendance Upsert (Admin updating worker status)...');
  const updatePayload = {
    date: testDate,
    records: [
      { workerId: workerIds[2], status: 'present', notes: 'Arrived extremely late, marked present with warning' },
    ],
  };

  const updateRes = await fetch(`${BASE_URL}/attendance/mark`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify(updatePayload),
  });
  const updateData = await updateRes.json();
  assert(updateRes.status === 200, 'Attendance updated with status 200');
  assert(updateData.summary.matchedCount === 1, 'Mongoose successfully matched and updated 1 existing record');

  // 11. Admin & Gerant Get Daily Reports
  console.log('\nStep 11: Fetching Daily Attendance Summary (Gerant access)...');
  const dailyRes = await fetch(`${BASE_URL}/attendance/daily/${testDate}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${gerantToken}` },
  });
  const dailyData = await dailyRes.json();
  assert(dailyRes.status === 200, 'Daily attendance retrieved with status 200');
  assert(dailyData.summary.date === testDate, 'Daily summary date matches');
  assert(dailyData.summary.present === 2, 'Summary present count is 2 (originally 1 present + 1 updated to present)');
  assert(dailyData.summary.late === 1, 'Summary late count is 1');
  assert(dailyData.summary.absent === 0, 'Summary absent count is 0 (since the absent worker was updated to present)');
  assert(dailyData.data.length === 3, 'Detailed list contains exactly 3 logs');

  // 12. Fetch Worker History & Metrics (Admin + Gerant)
  console.log('\nStep 12: Fetching Worker Attendance History & Metrics (Gerant access)...');
  const historyRes = await fetch(`${BASE_URL}/attendance/worker/${workerIds[0]}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${gerantToken}` },
  });
  const historyData = await historyRes.json();
  assert(historyRes.status === 200, 'Worker history retrieved with status 200');
  assert(historyData.worker.name === 'John Doe', 'Worker name matches in history response');
  assert(historyData.metrics.presentDays === 1, 'Worker present days metric matches');
  assert(historyData.metrics.attendancePercentage === 100, 'Worker attendance percentage is 100%');
  assert(historyData.history.length === 1, 'Worker has exactly 1 attendance log in history');

  // 13. Fetch Date Range Report (Admin & Gerant)
  console.log('\nStep 13: Fetching Date Range Aggregation Report (Gerant access)...');
  // Query July 2026 to capture our test date
  const rangeRes = await fetch(`${BASE_URL}/attendance/range?start=2026-07-01&end=2026-07-31`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${gerantToken}` },
  });
  const rangeData = await rangeRes.json();
  assert(rangeRes.status === 200, 'Date range report retrieved with status 200');
  assert(rangeData.length >= 3, 'Date range report contains entries for all 3 workers');
  
  // Find John Doe in range report
  const johnReport = rangeData.find(r => r.worker.name === 'John Doe');
  assert(johnReport !== undefined, 'John Doe is included in the date range report');
  assert(johnReport.metrics.totalDaysLogged === 1, 'John Doe total days logged matches in range report');
  assert(johnReport.metrics.attendancePercentage === 100, 'John Doe attendance percentage matches in range report');

  console.log('\n==================================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('The backend is fully operational with "gerant" and "admin" roles.');
  console.log('==================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ VERIFICATION EXCEPTION OCCURRED:', err);
  process.exit(1);
});

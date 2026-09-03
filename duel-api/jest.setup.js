const path = require('path');
const bcrypt = require('bcryptjs');

const testDbPath = path.join(__dirname, 'prisma', 'test.db');

process.env.NODE_ENV = 'test';
process.env.DB_PROVIDER = 'sqlite';
process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.SQLITE_URL = process.env.DATABASE_URL;

// Secrets factices, uniquement pour les tests.
process.env.JWT_SECRET = 'test-jwt-secret-'.padEnd(48, 'x');
process.env.ADMIN_JWT_SECRET = 'test-admin-jwt-secret-'.padEnd(48, 'y');
process.env.OTP_SECRET = 'test-otp-secret-'.padEnd(48, 'z');
process.env.TRACKING_SECRET = 'test-tracking-secret-'.padEnd(48, 'w');
process.env.JWT_EXPIRES_IN = '1h';

process.env.ADMIN_USERNAME = 'admin';
process.env.TEST_ADMIN_PASSWORD = 'admin-test-password';
// Coût bcrypt volontairement bas : ces hashes ne servent qu'aux tests.
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.TEST_ADMIN_PASSWORD, 4);

process.env.FRONTEND_URL = 'https://frontend.test';
process.env.OTP_RESEND_SECONDS = '0';

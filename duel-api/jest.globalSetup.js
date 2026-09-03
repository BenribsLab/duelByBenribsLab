const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

module.exports = async () => {
  const root = __dirname;
  const testDbPath = path.join(root, 'prisma', 'test.db');
  for (const suffix of ['', '-journal']) {
    fs.rmSync(`${testDbPath}${suffix}`, { force: true });
  }

  execFileSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['prisma', 'db', 'push', '--schema', 'prisma/schema.sqlite.prisma', '--skip-generate', '--force-reset'],
    {
      cwd: root,
      stdio: 'inherit',
      // Sous Windows, npx.cmd est un script batch : execFileSync doit passer
      // par le shell pour l'executer (sinon EINVAL).
      shell: process.platform === 'win32',
      env: { ...process.env, DATABASE_URL: `file:${testDbPath}` }
    }
  );
};

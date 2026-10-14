const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

if (!fs.existsSync(schemaPath)) {
  console.error(`❌ Schema file not found at: ${schemaPath}`);
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');
const dbUrl = process.env.DATABASE_URL || '';
const isPostgres =
  dbUrl.startsWith('postgres://') ||
  dbUrl.startsWith('postgresql://') ||
  process.env.DATABASE_PROVIDER === 'postgresql';

if (isPostgres) {
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  console.log('✅ Configured Prisma datasource provider to: postgresql (Production Render)');
} else {
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  console.log('ℹ️  Configured Prisma datasource provider to: sqlite (Local Zero-Config)');
}

fs.writeFileSync(schemaPath, schema);

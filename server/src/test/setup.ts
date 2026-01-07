import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database or any global test configuration
  console.log('Setting up backend tests...');
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
  console.log('Backend tests complete. Cleanup done.');
});

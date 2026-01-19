export interface TestUser {
  email: string;
  username: string;
  password: string;
}

export const testUsers = {
  coach1: {
    email: 'coach1@e2etest.com',
    username: 'testcoach1',
    password: 'TestPassword123!',
  },
  coach2: {
    email: 'coach2@e2etest.com',
    username: 'testcoach2',
    password: 'TestPassword123!',
  },
  coach3: {
    email: 'coach3@e2etest.com',
    username: 'testcoach3',
    password: 'TestPassword123!',
  },
};

/**
 * Generate a unique test user for each test run
 */
export function generateTestUser(): TestUser {
  const timestamp = Date.now();
  return {
    email: `testuser-${timestamp}@e2etest.com`,
    username: `testuser${timestamp}`,
    password: 'TestPassword123!',
  };
}

import dotenv from 'dotenv';
import fs from 'node:fs';

dotenv.config({ path: '.env' });

const baseUrl = `http://localhost:${process.env.PORT}/api/v1`;

const createMockUsers = async () => {
  const users = JSON.parse(fs.readFileSync("./mock-data/users.json"));
  const promises = users.map(async (user) => {
    try {
      fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (e) {
      console.log(e.message);
    }
  });

  try {
    await Promise.all(promises);
    console.log('All users created successfully.');
  } catch (error) {
    console.error('Error creating users:', error);
  }
};

if (process.argv[2] === '--create-users') {
  await createMockUsers();
}

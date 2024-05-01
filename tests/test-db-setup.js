import { afterAll, afterEach } from '@jest/globals';
import mongooseInstance from '../initialize-db.js';

async function removeAllCollections() {
  const { collections } = mongooseInstance.connections[0];
  const collectionNames = Object.keys(collections);
  const promises = collectionNames.map(async collectionName => {
    const collection = collections[collectionName];
    await collection.deleteMany();
  });
  try {
    await Promise.all(promises);
    console.log('All collections removed successfully.');
  } catch (error) {
    console.error('Error removing collections:', error);
  }
}

async function setupDB() {
  // Cleans up database between each test
  afterEach(async () => {
    await removeAllCollections();
  });

  // Disconnect Mongoose
  afterAll(async () => {
    await removeAllCollections();
    await mongooseInstance.connections[0].close();
  });
}

export default setupDB;

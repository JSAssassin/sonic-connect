import mongooseInstance from '../initialize-db.js';

async function removeAllCollections() {
  const [{ collections }] = mongooseInstance.connections;
  const collectionNames = Object.keys(collections);
  const promises = collectionNames.map(async collectionName => {
    const collection = collections[collectionName];
    return collection.deleteMany();
  });
  await Promise.all(promises);
}

async function removePlaylistsCollection() {
  const [{ collections }] = mongooseInstance.connections;
  const collectionNames = Object.keys(collections);
  const promises = collectionNames.map(async collectionName => {
    if(collectionName === 'playlists') {
      const collection = collections[collectionName];
      return collection.deleteMany();
    }
    return undefined;
  });
  await Promise.all(promises);
}

async function closeConnection() {
  await mongooseInstance.disconnect();
}

export {
  closeConnection,
  removeAllCollections,
  removePlaylistsCollection
};

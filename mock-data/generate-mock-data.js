import dotenv from 'dotenv';
import { FormData } from 'formdata-node';
// eslint-disable-next-line import/no-unresolved
import { fileFromPath } from 'formdata-node/file-from-path';
import fs from 'node:fs';

dotenv.config({ path: '.env' });

const baseUrl = `http://localhost:${process.env.PORT}/api/v1`;
const headers = { 'Content-Type': 'application/json' };

const createMockUsers = async () => {
  const users = JSON.parse(fs.readFileSync("./mock-data/users.json"));
  const promises = users.map(async user => fetch(`${baseUrl}/auth/signup`, {
    method: 'POST',
    body: JSON.stringify(user),
    headers
  }));
  try {
    await Promise.all(promises);
    console.log('Mock users created successfully.');
  } catch (error) {
    console.error('Error creating users:', error);
  }
};

const loginMockAdmin = async () => {
  const body = JSON.stringify({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
  })
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    body,
    headers
  });
  if (res.status !== 200) {
    throw new Error('Failed to log in mock admin');
  }
  return res.headers.get('set-cookie').split(';')[0].split('=')[1];
};

const createMockArtists = async ({ adminJWT } = {}) => {
  const artists = JSON.parse(fs.readFileSync("./mock-data/artists.json"));
  const promises = artists.map(async artist => {
    const artistPhotoPath = artist.photo;
    const file = await fileFromPath(artistPhotoPath, 'file', {
      type: 'image/jpeg'
    });
    const form = new FormData();
    form.set("file", file);

    const res = await fetch(`${baseUrl}/files/upload`, {
      method: 'POST',
      body: form,
      headers: {
        'Cookie': `jwt=${adminJWT}`,
      }
    });
    const { data: { file: { id: artistPhoto } } } = await res.json();
    const artistData = { ...artist };
    artistData.photo = artistPhoto;
    await fetch(`${baseUrl}/artists`, {
      method: 'POST',
      body: JSON.stringify(artistData),
      headers: {
        ...headers,
       'Cookie': `jwt=${adminJWT}`,
      }
    });
  });

  try {
    await Promise.all(promises);
    console.log('Mock artists created successfully.');
  } catch (error) {
    console.error('Error creating mock artists:', error);
  }
};

if (process.argv[2] === '--create-users') {
  await createMockUsers();
}

if (process.argv[2] === '--create-artists') {
  const jwt = await loginMockAdmin();
  await createMockArtists({ adminJWT: jwt });
}

import dotenv from 'dotenv';
import { FormData } from 'formdata-node';
// https://github.com/firebase/firebase-admin-node/discussions/1359
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
  const { jwt } = await res.json();
  return jwt;
};

const uploadFormData = async ({ filePath, type, jwt } = {}) => {
  const file = await fileFromPath(filePath, 'file', { type });
  const form = new FormData();
  form.set("file", file);
  const res = await fetch(`${baseUrl}/files/upload`, {
    method: 'POST',
    body: form,
    headers: {
      'Authorization': `Bearer ${jwt}`
    }
  });
  return res.json();
}

const createMockArtists = async ({ jwt } = {}) => {
  const data = JSON.parse(fs.readFileSync("./mock-data/artists.json"));
  const promises = data.map(async artistData => {
    const artist = { ...artistData };
    const { data: { file: { id: photo } } } = await uploadFormData({
      filePath: artist.photo, type: 'image/jpeg', jwt
    });
    artist.photo = photo;
    await fetch(`${baseUrl}/artists`, {
      method: 'POST',
      body: JSON.stringify(artist),
      headers: {
        ...headers,
        'Authorization': `Bearer ${jwt}`
      }
    });
  });
  try {
    await Promise.all(promises);
    console.log('Mock artists created successfully.');
  } catch (error) {
    console.error('Error creating mock artists:', error);
  }
}

const getArtistID = async ({ queryParams, jwt } = {}) => {
  const queryString = new URLSearchParams(queryParams).toString();
  const url = `${baseUrl}/artists?${queryString}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...headers,
      'Authorization': `Bearer ${jwt}`
    }
  });
  const { data: { artists: [{ _id: artistId }] } } = await res.json();
  return artistId;
}

const getAlbumID = async ({ queryParams, jwt } = {}) => {
  const queryString = new URLSearchParams(queryParams).toString();
  const url = `${baseUrl}/albums?${queryString}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...headers,
      'Authorization': `Bearer ${jwt}`
    }
  });
  const { data: { albums: [{ _id: albumId }] } } = await res.json();
  return albumId;
}

const createMockAlbums = async ({ jwt } = {}) => {
  const data = JSON.parse(fs.readFileSync("./mock-data/albums.json"));
  const promises = data.map(async albumData => {
    const album = { ...albumData };
    const { data: { file: { id: photo } } } = await uploadFormData({
      filePath: album.photo, type: 'image/jpeg', jwt
    });
    album.photo = photo;
    const artistPromises = album.artists.map(async artist => {
      const queryParams = { name: artist };
      return getArtistID({ queryParams, jwt });;
    });
    const artists = await Promise.all(artistPromises);
    album.artists = artists;
    await fetch(`${baseUrl}/albums`, {
      method: 'POST',
      body: JSON.stringify(album),
      headers: {
        ...headers,
        'Authorization': `Bearer ${jwt}`
      }
    });
  });
  try {
    await Promise.all(promises);
    console.log('Mock albums created successfully.');
  } catch (error) {
    console.error('Error creating mock albums:', error);
  }
}

const createMockSongs = async ({ jwt } = {}) => {
  const data = JSON.parse(fs.readFileSync("./mock-data/songs.json"));
  const promises = data.map(async songData => {
    const song = { ...songData };
    if (song.photo) {
      const { data: { file: { id: photo } } } = await uploadFormData({
        filePath: songData.photo, type: 'image/jpeg', jwt
      });
      song.photo = photo;
    }
    const { data: { file: { id: audioFile } } } = await uploadFormData({
      filePath: songData.audioFile, type: 'audio/mp3', jwt
    });
    song.audioFile = audioFile;
    const artistPromises = song.artists.map(async artist => {
      const queryParams = { name: artist };
      return getArtistID({ queryParams, jwt });
    });
    const artists = await Promise.all(artistPromises);
    song.artists = artists;
    if (song.featuredArtists) {
      const featuredArtistPromises = song.featuredArtists.map(async artist => {
        const queryParams = { name: artist };
        return getArtistID({ queryParams, jwt });
      });
      const featuredArtists = await Promise.all(featuredArtistPromises);
      song.featuredArtists = featuredArtists;
    }
    if (song.album) {
      const queryParams = { title: song.album };
      const albumId = await getAlbumID({ queryParams, jwt });
      song.album = albumId;
    }
    await fetch(`${baseUrl}/songs`, {
      method: 'POST',
      body: JSON.stringify(song),
      headers: {
        ...headers,
        'Authorization': `Bearer ${jwt}`
      }
    });
  });
  try {
    await Promise.all(promises);
    console.log('Mock songs created successfully.');
  } catch (error) {
    console.error('Error creating mock songs:', error);
  }
}

if (process.argv[2] === '--create-mock-users') {
  await createMockUsers();
}

if (process.argv[2] === '--create-mock-artists') {
  const jwt = await loginMockAdmin();
  await createMockArtists({ jwt });
}

if (process.argv[2] === '--create-mock-albums') {
  const jwt = await loginMockAdmin();
  await createMockAlbums({ jwt });
}

if (process.argv[2] === '--create-mock-songs') {
  const jwt = await loginMockAdmin();
  await createMockSongs({ jwt });
}

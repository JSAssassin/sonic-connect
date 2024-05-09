import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import { closeConnection, removeAllCollections } from './test-db-setup.js';
import {
  createArtists, createPlaylist, createSongs, createAlbums, loginUser,
  registerUsers
} from './helpers.js';

const mockArtists = JSON.parse(fs.readFileSync("./mock-data/artists.json"));
const mockUsers = JSON.parse(fs.readFileSync("./mock-data/users.json"));
const mockAlbums = JSON.parse(fs.readFileSync("./mock-data/albums.json"));
const mockSongs = JSON.parse(fs.readFileSync("./mock-data/songs.json"));

describe('API /playlists', () => {
  let aliceJWT;
  let bobJWT;
  let songs;
  beforeEach(async () => {
    await removeAllCollections();
    // create mock users
    await registerUsers({ users: mockUsers });
    const adminLoginResponse = await loginUser({
      email: 'admin@email.com',
      password: 'admin1234567'
    });
    const { body: { jwt: adminJWT } } = adminLoginResponse;
    expect(adminJWT).toBeDefined();
    const aliceLoginResponse = await loginUser({
      email: 'alice@email.com',
      password: 'alice1234567'
    });
    ({ body: { jwt: aliceJWT } } = aliceLoginResponse);
    expect(aliceJWT).toBeDefined();
    const bobLoginResponse = await loginUser({
      email: 'bob@email.com',
      password: 'bob1234567'
    });
    ({ body: { jwt: bobJWT } } = bobLoginResponse);
    expect(bobJWT).toBeDefined();
    // create mock artists
    const artists = await createArtists({
      artists: mockArtists,
      token: adminJWT
    });
    // create mock albums
    const albums = await createAlbums({
      albums: mockAlbums,
      artists,
      token: adminJWT
    });
    // create mock songs
    (songs = await createSongs({
      songs: mockSongs,
      artists,
      albums,
      token: adminJWT
    }));
  });
  afterAll(async () => {
    await removeAllCollections();
    await closeConnection();
  });
  describe('POST /playlists', () => {
    test('user should be able create a new playlist which is private ' +
      'by default.', async () => {
        const selectedSongsByAlice = songs.filter(song => song.artists.find(
          artist => artist.name === 'Alan Walker')).map(song => {
            const { _id: songId } = song;
            return songId;
          });
        const response = await createPlaylist({
          playlistTitle: 'Favorite Alan Walker Songs',
          songs: selectedSongsByAlice,
          token: aliceJWT
        });
        const { status, body: { data: { playlist } } } = response;
        expect(status).toBe(201);
        expect(playlist).toBeDefined();
        expect(playlist.title).toBe('Favorite Alan Walker Songs');
        const playlistSongs = playlist.songs.map(song => {
          const { _id: songId } = song;
          return songId;
        });
        expect(playlistSongs).toEqual(selectedSongsByAlice);
        expect(playlist.isPublic).toBe(false);
      });
    test('user should be able create a new public playlist', async () => {
      const selectedSongsByAlice = songs.filter(song => song.artists.find(
        artist => artist.name === 'Alan Walker')).map(song => {
          const { _id: songId } = song;
          return songId;
        });
      const response = await createPlaylist({
        playlistTitle: 'Favorite Alan Walker Songs',
        songs: selectedSongsByAlice,
        token: aliceJWT,
        isPublic: true
      });
      const { status, body: { data: { playlist } } } = response;
      expect(status).toBe(201);
      expect(playlist).toBeDefined();
      expect(playlist.title).toBe('Favorite Alan Walker Songs');
      const playlistSongs = playlist.songs.map(song => {
        const { _id: songId } = song;
        return songId;
      });
      expect(playlistSongs).toEqual(selectedSongsByAlice);
      expect(playlist.isPublic).toBe(true);
    });
    test('should error if any song specified in the playlist is invalid',
      async () => {
        const selectedSongsByAlice = songs.filter(song => song.artists.find(
          artist => artist.name === 'Alan Walker')).map(song => {
            const { _id: songId } = song;
            return songId;
          });
        // Add an invalid song ID to the selected songs
        const nonExistingSong = '663ad462ca6f48b5c12898ec';
        selectedSongsByAlice.push(nonExistingSong);
        const response = await createPlaylist({
          playlistTitle: 'Favorite Alan Walker Songs',
          songs: selectedSongsByAlice,
          token: aliceJWT
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `"songs": "${nonExistingSong}" does not exist.`);
      });
    test('should error if songs is not an array', async () => {
      const selectedSongsByAlice = songs.filter(song => song.artists.find(
        artist => artist.name === 'Alan Walker')).map(song => {
          const { _id: songId } = song;
          return songId;
        });
      const response = await createPlaylist({
        playlistTitle: 'Favorite Alan Walker Songs',
        songs: selectedSongsByAlice[0],
        token: aliceJWT
      });
      const { status, body: { message } } = response;
      expect(status).toBe(400);
      expect(message).toContain(`"songs" must be an array.`);
    });
  });
});

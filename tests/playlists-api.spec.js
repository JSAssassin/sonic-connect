import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import { closeConnection, removeAllCollections } from './test-db-setup.js';
import {
  createArtists, createMockPlaylists, createPlaylist, createSongs, createAlbums,
  deletePlaylist, getPlaylist, getPlaylists, loginUser, registerUsers
} from './helpers.js';

const mockArtists = JSON.parse(fs.readFileSync("./mock-data/artists.json"));
const mockUsers = JSON.parse(fs.readFileSync("./mock-data/users.json"));
const mockAlbums = JSON.parse(fs.readFileSync("./mock-data/albums.json"));
const mockSongs = JSON.parse(fs.readFileSync("./mock-data/songs.json"));

describe('API /playlists', () => {
  let aliceJWT;
  let bobJWT;
  let songs;
  let aliceId;
  beforeEach(async () => {
    await removeAllCollections();
    // create mock users
    const registeredUsers = await registerUsers({ users: mockUsers });
    ({ id: aliceId } = {
      ...registeredUsers.find(
        user => user.name === 'alice')
    });
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
    test('user should be able to create a new playlist which is private ' +
      'by default.', async () => {
        const selectedSongsByAlice = songs.filter(song => song.artists.find(
          artist => artist.name === 'Alan Walker')).map(song => {
            const { _id: songId } = song;
            return songId;
          });
        const response = await createPlaylist({
          title: 'Favorite Alan Walker Songs',
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
    test('user should be able to create a new public playlist', async () => {
      const selectedSongsByAlice = songs.filter(song => song.artists.find(
        artist => artist.name === 'Alan Walker')).map(song => {
          const { _id: songId } = song;
          return songId;
        });
      const response = await createPlaylist({
        title: 'Favorite Alan Walker Songs',
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
          title: 'Favorite Alan Walker Songs',
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
        title: 'Favorite Alan Walker Songs',
        songs: selectedSongsByAlice[0],
        token: aliceJWT
      });
      const { status, body: { message } } = response;
      expect(status).toBe(400);
      expect(message).toContain(`"songs" must be an array.`);
    });
  });
  describe('GET /playlists', () => {
    test('user should be able to get all the playlists they have created.',
      async () => {
        // Create mock playlists for Alice. This will create two playlists,
        // a private and a public playlist for Alice.
        await createMockPlaylists({
          songs,
          privateArtist: 'Alan Walker',
          publicArtist: 'Rival',
          token: aliceJWT,
          user: 'Alice'
        });
        const response = await getPlaylists({
          token: aliceJWT
        });
        const { status, body: { count, data: { playlists } } } = response;
        expect(status).toBe(200);
        expect(playlists).toBeDefined();
        expect(count).toBe(2);
      });
    test('user should only be able to get public playlists of other users.',
      async () => {
        // Create mock playlists for Alice. This will create two playlists,
        // a private and a public playlist for Alice.
        await createMockPlaylists({
          songs,
          privateArtist: 'Alan Walker',
          publicArtist: 'Rival',
          token: aliceJWT,
          user: 'Alice'
        });
        // Bob tries to get all of Alice's playlists, should only be able to
        // get the public playlist of Alice.
        const response = await getPlaylists({
          token: bobJWT,
          queryParams: { user: aliceId }
        });
        const { status, body: { count, data: { playlists } } } = response;
        expect(status).toBe(200);
        expect(playlists).toBeDefined();
        expect(count).toBe(1);
      });
  });
  describe('GET /playlists/:playlistId', () => {
    test('user should be able to get both their private and public playlist '
      + 'by ID', async () => {
        // Create mock playlists for Alice. This will create two playlists,
        // a private and a public playlist for Alice.
        const { privatePlaylist, publicPlaylist } = await createMockPlaylists({
          songs,
          privateArtist: 'Alan Walker',
          publicArtist: 'Rival',
          token: aliceJWT,
          user: 'Alice'
        });
        const response1 = await getPlaylist({
          playlistId: privatePlaylist.playlistId,
          token: aliceJWT
        });
        const {
          status: status1, body: { data: { playlist: playlist1 } }
        } = response1;
        expect(status1).toBe(200);
        expect(playlist1).toBeDefined();
        const { _id: playlist1Id } = playlist1;
        expect(playlist1Id).toBe(privatePlaylist.playlistId);
        const response2 = await getPlaylist({
          playlistId: publicPlaylist.playlistId,
          token: aliceJWT
        });
        const {
          status: status2, body: { data: { playlist: playlist2 } }
        } = response2;
        expect(status2).toBe(200);
        expect(playlist1).toBeDefined();
        const { _id: playlist2Id } = playlist2;
        expect(playlist2Id).toBe(publicPlaylist.playlistId);
      });
    test(`user should to get to other users' public playlist by ID.`,
      async () => {
        // Get Alice's public playlist ID
        const { publicPlaylist } = await createMockPlaylists({
          songs,
          privateArtist: 'Alan Walker',
          publicArtist: 'Rival',
          token: aliceJWT,
          user: 'Alice'
        });
        // Bob tries to get the public playlist of Alice, this should work
        const response = await getPlaylist({
          playlistId: publicPlaylist.playlistId,
          token: bobJWT
        });
        const {
          status, body: { data: { playlist } }
        } = response;
        expect(status).toBe(200);
        expect(playlist).toBeDefined();
        const { _id: playlisId } = playlist;
        expect(playlisId).toBe(publicPlaylist.playlistId);
      });
    test(`user should not be able to get other users' private playlist by ID.`,
      async () => {
        // Get Alice's private playlist ID
        const { privatePlaylist } = await createMockPlaylists({
          songs,
          privateArtist: 'Alan Walker',
          publicArtist: 'Rival',
          token: aliceJWT,
          user: 'Alice'
        });
        // Bob tries to get the private playlist of Alice, this should fail
        const response = await getPlaylist({
          playlistId: privatePlaylist.playlistId,
          token: bobJWT
        });
        const {
          status, body: { message }
        } = response;
        expect(status).toBe(403);
        expect(message).toContain(
          `The playlist "${privatePlaylist.title}" you are trying to access ` +
          `is private.`);
      });
  });
  describe('DELETE /playlists/:playlistId', () => {
    test('user should be able to delete both their private and public playlist '
      + 'by ID', async () => {
        // Create mock playlists for Alice. This will create two playlists,
        // a private and a public playlist for Alice.
        const { privatePlaylist, publicPlaylist } = await createMockPlaylists({
          songs,
          privateArtist: 'Alan Walker',
          publicArtist: 'Rival',
          token: aliceJWT,
          user: 'Alice'
        });
        const response1 = await deletePlaylist({
          playlistId: privatePlaylist.playlistId,
          token: aliceJWT
        });
        const { status: status1 } = response1;
        expect(status1).toBe(200);
        const response2 = await getPlaylist({
          playlistId: privatePlaylist.playlistId,
          token: aliceJWT
        });
        const {
          status: status2, body: { message: message1 }
        } = response2;
        expect(status2).toBe(404);
        expect(message1).toContain(
          `Playlist with ID "${privatePlaylist.playlistId}" not found.`);
        const response3 = await deletePlaylist({
          playlistId: publicPlaylist.playlistId,
          token: aliceJWT
        });
        const { status: status3 } = response3;
        expect(status3).toBe(200);
        const response4 = await getPlaylist({
          playlistId: publicPlaylist.playlistId,
          token: aliceJWT
        });
        const {
          status: status4, body: { message: message2 }
        } = response4;
        expect(status4).toBe(404);
        expect(message2).toContain(
          `Playlist with ID "${publicPlaylist.playlistId}" not found.`);
      });
    test(`user should not be able to delete other users' public or private ` +
      'playlists', async () => {
        // Get Alice's playlists
        const { privatePlaylist, publicPlaylist } = await createMockPlaylists({
          songs,
          privateArtist: 'Alan Walker',
          publicArtist: 'Rival',
          token: aliceJWT,
          user: 'Alice'
        });
        // Bob tries to delete the private playlist of Alice, this should fail
        const response1 = await deletePlaylist({
          playlistId: privatePlaylist.playlistId,
          token: bobJWT
        });
        const {
          status: status1, body: { message: message1 }
        } = response1;
        expect(status1).toBe(403);
        expect(message1).toContain(
          `You do not have access to delete the playlist ` +
          `"${privatePlaylist.title}".`);
        // Bob tries to delete the public playlist of Alice, this should fail
        const response2 = await deletePlaylist({
          playlistId: publicPlaylist.playlistId,
          token: bobJWT
        });
        const {
          status: status2, body: { message: message2 }
        } = response2;
        expect(status2).toBe(403);
        expect(message2).toContain(
          `You do not have access to delete the playlist ` +
          `"${publicPlaylist.title}".`);
      });
    test('should error if you try to delete a playlist that does not exist.',
      async () => {
        // Get one of Alice's playlist
        const { privatePlaylist } = await createMockPlaylists({
          songs,
          privateArtist: 'Alan Walker',
          publicArtist: 'Rival',
          token: aliceJWT,
          user: 'Alice'
        });
        // Delete the playlist
        const response1 = await deletePlaylist({
          playlistId: privatePlaylist.playlistId,
          token: aliceJWT
        });
        const { status: status1 } = response1;
        expect(status1).toBe(200);
        // Try to delete the playlist again
        const response2 = await deletePlaylist({
          playlistId: privatePlaylist.playlistId,
          token: aliceJWT
        });
        const {
          status: status2, body: { message }
        } = response2;
        expect(status2).toBe(404);
        expect(message).toContain(
          `Playlist with ID "${privatePlaylist.playlistId}" not found`);
      });
  });
});

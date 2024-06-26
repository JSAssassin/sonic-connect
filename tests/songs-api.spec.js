import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import { ObjectId } from 'bson';
import { closeConnection, removeAllCollections } from './test-db-setup.js';
import {
  createArtists, createSong, createSongData, createSongs, createAlbums,
  deleteSong, getSong, getSongs, loginUser, registerUsers, updateSong
} from './helpers.js';

const mockArtists = JSON.parse(fs.readFileSync("./mock-data/artists.json"));
const mockUsers = JSON.parse(fs.readFileSync("./mock-data/users.json"));
const mockAlbums = JSON.parse(fs.readFileSync("./mock-data/albums.json"));
const mockSongs = JSON.parse(fs.readFileSync("./mock-data/songs.json"));

describe('API /songs', () => {
  let adminJWT;
  let bobJWT;
  let artists;
  let albums;
  let songs;
  beforeAll(async () => {
    await removeAllCollections();
    // create mock users
    await registerUsers({ users: mockUsers });
    const adminLoginResponse = await loginUser({
      email: 'admin@email.com',
      password: 'admin1234567'
    });
    ({ body: { jwt: adminJWT } } = adminLoginResponse);
    expect(adminJWT).toBeDefined();
    const bobLoginResponse = await loginUser({
      email: 'bob@email.com',
      password: 'bob1234567'
    });
    ({ body: { jwt: bobJWT } } = bobLoginResponse);
    expect(bobJWT).toBeDefined();
    // create mock artists
    (artists = await createArtists({
      artists: mockArtists,
      token: adminJWT
    }));
    // create mock albums
    (albums = await createAlbums({
      albums: mockAlbums,
      artists,
      token: adminJWT
    }));
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
  describe('POST /songs', () => {
    test('admin should be able to create a new song.', async () => {
      const newSong = { ...mockSongs[2] };
      const songData = await createSongData({
        newSong, artists, albums, token: adminJWT
      });
      const response = await createSong({
        token: adminJWT,
        newSong: songData
      });
      const { status, body: { data: { song } } } = response;
      expect(status).toBe(201);
      expect(song).toBeDefined();
      expect(song.name).toBe(mockSongs[0].name);
      // clean up, delete the song
      const { _id: songId } = song;
      await deleteSong({
        songId,
        token: adminJWT
      });
    });
    test('should error if a non-admin user try to create song.',
      async () => {
        const newSong = { ...mockSongs[0] };
        const songData = await createSongData({
          newSong, artists, albums, token: adminJWT
        });
        const response = await createSong({
          token: bobJWT,
          newSong: songData
        });
        const { status, body: { message } } = response;
        expect(status).toBe(403);
        expect(message).toContain(
          'You do not have to permission to perform this action.');
      });
    test('should error if song photo is invalid or non existent.',
      async () => {
        const newSong = { ...mockSongs[0] };
        const songData = await createSongData({
          newSong, artists, albums, token: adminJWT
        });

        // intentionally set the song photo to an non existent ID
        const nonExistentPhotoId = (new ObjectId()).toString();
        songData.photo = nonExistentPhotoId;
        const response = await createSong({
          token: adminJWT,
          newSong: songData
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(`Photo "${songData.photo}" does not exist.`);
      });
    test('should error if artist specified for the song is invalid or ' +
      'non existent.', async () => {
        const newSong = { ...mockSongs[0] };
        const songData = await createSongData({
          newSong, artists, albums, token: adminJWT
        });
        // intentionally set the artists to non existent one
        const nonExistentArtistId = (new ObjectId()).toString();
        songData.artists = [nonExistentArtistId];
        const response = await createSong({
          token: adminJWT,
          newSong: songData
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `"artists": "${songData.artists.join(', ')}" does not exist.`);
      });
    test('should error if audio file specified for the song is invalid or ' +
      'non existent.', async () => {
        const newSong = { ...mockSongs[0] };
        const songData = await createSongData({
          newSong, artists, albums, token: adminJWT
        });
        // intentionally set the audio file to a non existent one
        const nonExistentAudioFile = (new ObjectId()).toString();
        songData.audioFile = nonExistentAudioFile;
        const response = await createSong({
          token: adminJWT,
          newSong: songData
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `Audio file "${songData.audioFile}" does not exist.`);
      });
    test('should error if album specified for the song is invalid or ' +
      'non existent.', async () => {
        const newSong = { ...mockSongs[3] };
        const songData = await createSongData({
          newSong, artists, albums, token: adminJWT
        });
        // intentionally set the song album to a non existent one
        const nonExistentAlbum = (new ObjectId()).toString();
        songData.album = nonExistentAlbum;
        const response = await createSong({
          token: adminJWT,
          newSong: songData
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `Album ID "${songData.album}" does not exist.`);
      });
    test('should error if featured artists specified for the song is invalid ' +
      'or non existent.', async () => {
        const newSong = { ...mockSongs[2] };
        const songData = await createSongData({
          newSong, artists, albums, token: adminJWT
        });
        // intentionally set the featured artists to non existent one
        const nonExistentFeaturedArtistId = (new ObjectId()).toString();
        songData.featuredArtists = [nonExistentFeaturedArtistId];
        const response = await createSong({
          token: adminJWT,
          newSong: songData
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `"featuredArtists": "${songData.featuredArtists.join(', ')}" ` +
          `does not exist.`);
      });
  })
  describe('GET /songs', () => {
    test('admins and non-admin users should be able to get all albums.',
      async () => {
        const response = await getSongs({
          token: adminJWT
        });
        const {
          status: status1,
          body: {
            count: count1, data: { songs: songs1 }
          }
        } = response;
        expect(status1).toBe(200);
        expect(songs1).toBeDefined();
        expect(songs1).toBeInstanceOf(Array);
        expect(count1).toBe(songs.length);
        const response2 = await getSongs({
          token: bobJWT
        });
        const {
          status: status2,
          body: {
            count: count2, data: { songs: songs2 }
          }
        } = response2;
        expect(status2).toBe(200);
        expect(songs2).toBeDefined();
        expect(songs2).toBeInstanceOf(Array);
        expect(count2).toBe(songs.length);
      });
  })
  describe('GET /songs/:songId', () => {
    test('admins and non-admin users should be able to get a song ' +
      'by its ID.', async () => {
        const { _id: songId } = songs[0];
        const response1 = await getSong({
          songId,
          token: adminJWT,
        });
        const {
          status: status1,
          body: { data: { song: song1 } }
        } = response1;
        expect(status1).toBe(200);
        expect(song1).toBeDefined();
        expect(song1.name).toBe(songs[0].name);
        const response2 = await getSong({
          songId,
          token: bobJWT,
        });
        const {
          status: status2,
          body: { data: { song: song2 } }
        } = response2;
        expect(status2).toBe(200);
        expect(song2).toBeDefined();
        expect(song2.name).toBe(songs[0].name);
      });
  })
  describe('DELETE /songs/:songId', () => {
    test('admin should be able to delete a song by its ID.', async () => {
      const { _id: songId } = songs[0];
      const response1 = await deleteSong({
        songId,
        token: adminJWT
      });
      const { status: status1 } = response1;
      expect(status1).toBe(200);
      // try to get the song that was deleted, that should fail
      const response2 = await getSong({
        songId,
        token: adminJWT,
      });
      const {
        status: status2,
        body: { message }
      } = response2;
      expect(status2).toBe(404);
      expect(message).toContain(`Song with ID "${songId}" not found.`);
    });
    test('should error if a non-admin user try to delete a song.',
      async () => {
        const { _id: songId } = songs[1];
        const response = await deleteSong({
          songId,
          token: bobJWT
        });
        const { status, body: { message } } = response;
        expect(status).toBe(403);
        expect(message).toContain(
          'You do not have to permission to perform this action.');
      });
  })
  describe('PATCH /songs/:songId', () => {
    test('admin should be able to update a song by its ID.', async () => {
      const { _id: songId } = songs[2];
      const updatedArtists = artists
        .filter(
          artist => artist.name === 'Rival' || artist.name === 'Harley Bird')
        .map(artist => {
          const { _id: artistId } = artist;
          return artistId;
        });
      const updatedFeaturedArtists = artists
        .filter(
          artist => artist.name === 'Rival' || artist.name === 'Harley Bird')
        .map(artist => {
          const { _id: artistId } = artist;
          return artistId;
        });
      const updatedSong = {
        artists: updatedArtists,
        featuredArtists: updatedFeaturedArtists
      };
      const response = await updateSong({
        token: adminJWT,
        songId,
        updatedSong
      });
      const { status, body: { data: { song } } } = response;
      expect(status).toBe(200);
      expect(song).toBeDefined();
      expect(song.title).toBe(songs[2].title);
      const songArtists = song.artists.map(artist => {
        const { _id: artistId } = artist;
        return artistId;
      });
      const songFeaturedArtists = song.featuredArtists.map(featuredArtist => {
        const { _id: featuredArtistId } = featuredArtist;
        return featuredArtistId;
      });
      expect(songArtists).toEqual(updatedSong.artists);
      expect(songFeaturedArtists).toEqual(updatedSong.featuredArtists);
    });
    test('should error if a non-admin user try to update song.',
      async () => {
        const { _id: songId } = songs[2];
        const updatedSong = {
          genre: ["r&b", "pop"]
        };
        const response = await updateSong({
          token: bobJWT,
          songId,
          updatedSong
        });
        const { status, body: { message } } = response;
        expect(status).toBe(403);
        expect(message).toContain(
          'You do not have to permission to perform this action.');
      });
    test('should error if song photo that admin tries to update is invalid.',
      async () => {
        const { _id: songId } = songs[2];
        // set photo ID to a non existent ID
        const nonExistentPhotoId = (new ObjectId()).toString();
        const updatedSong = {
          photo: nonExistentPhotoId
        }
        const response = await updateSong({
          token: adminJWT,
          songId,
          updatedSong
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `Photo "${nonExistentPhotoId}" does not exist.`);
      });
    test('should error if audio file that admin tries to update is invalid.',
      async () => {
        const { _id: songId } = songs[2];
        // set audio file to a non existent ID
        const nonExistentAudioFile = (new ObjectId()).toString();
        const updatedSong = {
          audioFile: nonExistentAudioFile
        }
        const response = await updateSong({
          token: adminJWT,
          songId,
          updatedSong
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `Audio file "${nonExistentAudioFile}" does not exist.`);
      });
    test('should error if song album ID that admin tries to update is invalid.',
      async () => {
        const { _id: songId } = songs[2];
        // set album to a non existent ID
        const nonExistentAlbum = (new ObjectId()).toString();
        const updatedSong = {
          album: nonExistentAlbum
        }
        const response = await updateSong({
          token: adminJWT,
          songId,
          updatedSong
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `Album ID "${nonExistentAlbum}" does not exist.`);
      });
    test('should error if the artist ID that admin tries to update is invalid.',
      async () => {
        const { _id: songId } = songs[2];
        // set artist ID to a non existent ID
        const nonExistentArtist = (new ObjectId()).toString();
        const updatedSong = {
          artists: [nonExistentArtist]
        }
        const response = await updateSong({
          token: adminJWT,
          songId,
          updatedSong
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `"artists": "${nonExistentArtist}" does not exist.`);
      });
    test('should error if the featured artist ID that admin tries to update ' +
      'is invalid.', async () => {
        const { _id: songId } = songs[2];
        // set featured artist ID to a non existent ID
        const nonExistentFeaturedArtist = (new ObjectId()).toString();
        const updatedSong = {
          featuredArtists: [nonExistentFeaturedArtist]
        }
        const response = await updateSong({
          token: adminJWT,
          songId,
          updatedSong
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `"featuredArtists": "${nonExistentFeaturedArtist}" does not exist.`);
      });
    test('should error if the "artists" is not an array.', async () => {
      const { _id: songId } = songs[2];
      const { _id: artistId } = artists[0];
      const updatedSong = {
        // artists not an array
        artists: artistId
      }
      const response = await updateSong({
        token: adminJWT,
        songId,
        updatedSong
      });
      const { status, body: { message } } = response;
      expect(status).toBe(400);
      expect(message).toContain(`"artists" must be an array.`);
    });
    test('should error if all the fields specified to be updated are non ' +
      'permissiable fields.', async () => {
        const { _id: songId } = songs[2];
        const updatedSong = {
          label: 'Example Records',
          rating: 7.5
        }
        const response = await updateSong({
          token: adminJWT,
          songId,
          updatedSong
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `You have not provided any permissible fields for updating`);
      });
  })
});

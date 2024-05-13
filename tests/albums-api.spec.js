import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import { ObjectId } from 'bson';
import { closeConnection, removeAllCollections } from './test-db-setup.js';
import {
  createArtists, createAlbum, createAlbumData, createAlbums, deleteAlbum,
  getAlbum, getAlbums, loginUser, registerUsers, updateAlbum,
  uploadFile
} from './helpers.js';

const mockArtists = JSON.parse(fs.readFileSync("./mock-data/artists.json"));
const mockUsers = JSON.parse(fs.readFileSync("./mock-data/users.json"));
const mockAlbums = JSON.parse(fs.readFileSync("./mock-data/albums.json"));


describe('API /albums', () => {
  let adminJWT;
  let bobJWT;
  let artists;
  let albums;
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
  });
  afterAll(async () => {
    await removeAllCollections();
    await closeConnection();
  });
  describe('POST /albums', () => {
    test('admin should be able to create a new album.', async () => {
      const newAlbum = { ...mockAlbums[0] };
      const albumData = await createAlbumData({
        newAlbum, artists, token: adminJWT
      });
      const response = await createAlbum({
        token: adminJWT,
        newAlbum: albumData
      });
      const { status, body: { data: { album } } } = response;
      expect(status).toBe(201);
      expect(album).toBeDefined();
      expect(album.name).toBe(mockAlbums[0].name);
      // clean up
      const { _id: albumId } = album;
      await deleteAlbum({
        albumId,
        token: adminJWT
      });
    });
    test('should error if a non-admin user try to create album.',
      async () => {
        const newAlbum = { ...mockAlbums[0] };
        const albumData = await createAlbumData({
          newAlbum, artists, token: adminJWT
        });
        const response = await createAlbum({
          token: bobJWT,
          newAlbum: albumData
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          'You do not have to permission to perform this action.');
      });
    test('should error if album photo is invalid or non existent.',
      async () => {
        const albumData = { ...mockAlbums[0] };
        const nonExistentPhotoId = (new ObjectId()).toString();
        albumData.photo = nonExistentPhotoId;
        const artistIds = albumData.artists.map(artistName => {
          const { _id: artistId } = artists.find(
            artist => artistName === artist.name);
          return artistId;
        });
        albumData.artists = artistIds;
        const response = await createAlbum({
          token: adminJWT,
          newAlbum: albumData
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `Photo "${nonExistentPhotoId}" does not exist.`);
      });
    test('should error if artist specified for the album is invalid or ' +
      'non existent.', async () => {
        const albumData = { ...mockAlbums[0] };
        const { body: { data: { file } } } = await uploadFile({
          filePath: albumData.photo, type: 'image/jpeg', token: adminJWT
        });
        albumData.photo = file.id;
        const nonExistentArtistId = (new ObjectId()).toString();
        albumData.artists = [nonExistentArtistId]
        const response = await createAlbum({
          token: adminJWT,
          newAlbum: albumData
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `"artists": "${nonExistentArtistId}" does not exist.`);
      });
  })
  describe('GET /albums', () => {
    test('admins and non-admin users should be able to get all albums.',
      async () => {
        const response = await getAlbums({
          token: adminJWT
        });
        const {
          status: status1,
          body: {
            count: count1, data: { albums: albums1 }
          }
        } = response;
        expect(status1).toBe(200);
        expect(albums1).toBeDefined();
        expect(albums1).toBeInstanceOf(Array);
        expect(count1).toBe(albums.length);
        const response2 = await getAlbums({
          token: bobJWT
        });
        const {
          status: status2,
          body: {
            count: count2, data: { albums: albums2 }
          }
        } = response2;
        expect(status2).toBe(200);
        expect(albums2).toBeDefined();
        expect(albums2).toBeInstanceOf(Array);
        expect(count2).toBe(albums.length);
      });
  })
  describe('GET /albums/:albumId', () => {
    test('admins and non-admin users should be able to get an album ' +
      'by its ID.', async () => {
        const { _id: albumId } = albums[0];
        const response1 = await getAlbum({
          albumId,
          token: adminJWT,
        });
        const {
          status: status1,
          body: { data: { album: album1 } }
        } = response1;
        expect(status1).toBe(200);
        expect(album1).toBeDefined();
        expect(album1.name).toBe(albums[0].name);
        const response2 = await getAlbum({
          albumId,
          token: bobJWT,
        });
        const {
          status: status2,
          body: { data: { album: album2 } }
        } = response2;
        expect(status2).toBe(200);
        expect(album2).toBeDefined();
        expect(album2.name).toBe(albums[0].name);
      });
  })
  describe('DELETE /albums/:albumId', () => {
    test('admin should be able to delete an album by its ID.', async () => {
      const { _id: albumId } = albums[1];
      const response1 = await deleteAlbum({
        albumId,
        token: adminJWT
      });
      const { status: status1 } = response1;
      expect(status1).toBe(200);
      // try to get the album that was deleted, that should fail
      const response2 = await getAlbum({
        albumId,
        token: adminJWT,
      });
      const {
        status: status2,
        body: { message }
      } = response2;
      expect(status2).toBe(404);
      expect(message).toContain(`Album with ID "${albumId}" not found.`);
    });
    test('should error if a non-admin user try to delete an album.',
      async () => {
        const { _id: albumId } = albums[0];
        const response = await deleteAlbum({
          albumId,
          token: bobJWT
        });
        const { status, body: { message } } = response;
        expect(status).toBe(403);
        expect(message).toContain(
          'You do not have to permission to perform this action.');
      });
  })
  describe('PATCH /albums/:albumId', () => {
    test('admin should be able to update an album by its ID.', async () => {
      const { _id: albumId } = albums[0];
      const updatedArtists = artists
        .filter(
          artist => artist.name === 'Ripple' || artist.name === 'Alan Walker')
        .map(artist => {
          const { _id: artistId } = artist;
          return artistId;
        });
      const updatedAlbum = {
        title: 'Ripple & Alan Remixes',
        description:
          `The album is a collection of Ripple and Alan's best remixes.`,
        genre: ["r&b", "pop"],
        artists: updatedArtists
      };
      const response = await updateAlbum({
        token: adminJWT,
        albumId,
        updatedAlbum
      });
      const { status, body: { data: { album } } } = response;
      expect(status).toBe(200);
      expect(album).toBeDefined();
      expect(album.title).toBe(updatedAlbum.title);
      expect(album.description).toBe(updatedAlbum.description);
      expect(album.genre).toEqual(updatedAlbum.genre);
      const albumArtists = album.artists.map(artist => {
        const { _id: artistId } = artist;
        return artistId;
      });
      expect(albumArtists).toEqual(updatedAlbum.artists);
    });
    test('should error if a non-admin user try to update album.',
      async () => {
        const { _id: albumId } = albums[0];
        const updatedAlbum = {
          releaseDate: '2024-04-20',
          genre: ["r&b", "pop"]
        };
        const response = await updateAlbum({
          token: bobJWT,
          albumId,
          updatedAlbum
        });
        const { status, body: { message } } = response;
        expect(status).toBe(403);
        expect(message).toContain(
          'You do not have to permission to perform this action.');
      });
    test('should error if photo ID that admin tries to update is invalid ' +
      'or non existent.', async () => {
        const { _id: albumId } = albums[0];
        // set photo to be updated to a non existent ID
        const nonExistentPhotoId = (new ObjectId()).toString();
        const updatedAlbum = {
          photo: nonExistentPhotoId
        }
        const response = await updateAlbum({
          token: adminJWT,
          albumId,
          updatedAlbum
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `Photo "${nonExistentPhotoId}" does not exist.`);
      });
    test('should error if the artist ID that admin tries to update is invalid.',
      async () => {
        const { _id: albumId } = albums[0];
        // set artist to be updated to a non existent ID
        const nonExistentArtistId = (new ObjectId()).toString();
        const updatedAlbum = {
          artists: [nonExistentArtistId]
        }
        const response = await updateAlbum({
          token: adminJWT,
          albumId,
          updatedAlbum
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `"artists": "${nonExistentArtistId}" does not exist.`);
      });
    test('should error if the artists is not an array.', async () => {
      const { _id: albumId } = albums[0];
      const { _id: artistId } = artists[0];
      const updatedAlbum = {
        // artists not an array
        artists: artistId
      }
      const response = await updateAlbum({
        token: adminJWT,
        albumId,
        updatedAlbum
      });
      const { status, body: { message } } = response;
      expect(status).toBe(400);
      expect(message).toContain(`"artists" must be an array.`);
    });
    test('should error if all the fields specified to be updated are non ' +
      'permissiable fields.', async () => {
        const { _id: albumId } = albums[0];
        const updatedAlbum = {
          label: 'Example Records',
          rating: 7.5
        }
        const response = await updateAlbum({
          token: adminJWT,
          albumId,
          updatedAlbum
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `You have not provided any permissible fields for updating`);
      });
  })
});

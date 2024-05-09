import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import { closeConnection, removeAllCollections } from './test-db-setup.js';
import {
  loginUser, createArtist, createArtists, deleteArtist, deleteFile, getArtist,
  getArtists, registerUsers, updateArtist, uploadFile
} from './helpers.js';

const mockArtists = JSON.parse(fs.readFileSync("./mock-data/artists.json"));
const mockUsers = JSON.parse(fs.readFileSync("./mock-data/users.json"));

describe('API /artists', () => {
  let adminJWT;
  let bobJWT;
  let artists;
  beforeEach(async () => {
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
    const [, ...artistsData] = mockArtists;
    // create mock artists
    (artists = await createArtists({
      artists: artistsData,
      token: adminJWT
    }));
  });
  afterAll(async () => {
    await removeAllCollections();
    await closeConnection();
  });
  describe('POST /artists', () => {
    test('admin should be able to create new artist.', async () => {
      const artistData = { ...mockArtists[0] };
      const { body: { data: { file: { id: photo } } } } = await uploadFile({
        filePath: artistData.photo, type: 'image/jpeg', token: adminJWT
      });
      artistData.photo = photo;
      const response = await createArtist({
        token: adminJWT,
        newArtist: artistData
      });
      const { status, body: { data: { artist } } } = response;
      expect(status).toBe(201);
      expect(artist).toBeDefined();
      expect(artist.name).toBe(mockArtists[0].name);
    });
    test('should error if a non-admin user try to create artist.',
      async () => {
        const artistData = { ...mockArtists[0] };
        const { body: { data: { file: { id: photo } } } } = await uploadFile({
          filePath: artistData.photo, type: 'image/jpeg', token: adminJWT
        });
        artistData.photo = photo;
        const response = await createArtist({
          token: bobJWT,
          newArtist: artistData
        });
        const { status, body: { message } } = response;
        expect(status).toBe(403);
        expect(message).toContain(
          'You do not have to permission to perform this action.');
      });
    test('should error if artist photo is invalid or non existent.',
      async () => {
        const artistData = { ...mockArtists[0] };
        const { body: { data: { file } } } = await uploadFile({
          filePath: artistData.photo, type: 'image/jpeg', token: adminJWT
        });
        artistData.photo = file.id;
        // intentionally delete the artist photo from DB
        await deleteFile({
          filename: file.filename, token: adminJWT
        });
        const response = await createArtist({
          token: adminJWT,
          newArtist: artistData
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `Photo "${artistData.photo}" does not exist.`);
      });
  })
  describe('GET /artists', () => {
    test('admins and non-admin users should be able to get all artists.',
      async () => {
        const response = await getArtists({
          token: adminJWT
        });
        const {
          status: status1,
          body: {
            count: count1, data: { artists: artists1 }
          }
        } = response;
        expect(status1).toBe(200);
        expect(artists1).toBeDefined();
        expect(artists1).toBeInstanceOf(Array);
        expect(count1).toBe(artists.length);
        const response2 = await getArtists({
          token: bobJWT
        });
        const {
          status: status2,
          body: {
            count: count2, data: { artists: artists2 }
          }
        } = response2;
        expect(status2).toBe(200);
        expect(artists2).toBeDefined();
        expect(artists2).toBeInstanceOf(Array);
        expect(count2).toBe(artists.length);
      });
  })
  describe('GET /artists/:artistId', () => {
    test('admins and non-admin users should be able to get an artist' +
      'by its ID.', async () => {
        const { _id: artistId } = artists[0];
        const response1 = await getArtist({
          artistId,
          token: adminJWT,
        });
        const {
          status: status1,
          body: { data: { artist: artist1 } }
        } = response1;
        expect(status1).toBe(200);
        expect(artist1).toBeDefined();
        expect(artist1.name).toBe(artists[0].name);
        const response2 = await getArtist({
          artistId,
          token: bobJWT,
        });
        const {
          status: status2,
          body: { data: { artist: artist2 } }
        } = response2;
        expect(status2).toBe(200);
        expect(artist2).toBeDefined();
        expect(artist2.name).toBe(artists[0].name);
      });
  })
  describe('DELETE /artists/:artistId', () => {
    test('admin should be able to delete an artist by its ID.', async () => {
      const { _id: artistId } = artists[0];
      const response1 = await deleteArtist({
        artistId,
        token: adminJWT
      });
      const { status: status1 } = response1;
      expect(status1).toBe(200);
      // try to get the artist that was deleted, that should fail
      const response2 = await getArtist({
        artistId,
        token: adminJWT,
      });
      const {
        status: status2,
        body: { message }
      } = response2;
      expect(status2).toBe(404);
      expect(message).toContain(`Artist with ID "${artistId}" not found.`);
    });
    test('should error if a non-admin user try to delete an artist.',
      async () => {
        const { _id: artistId } = artists[0];
        const response = await deleteArtist({
          artistId,
          token: bobJWT
        });
        const { status, body: { message } } = response;
        expect(status).toBe(403);
        expect(message).toContain(
          'You do not have to permission to perform this action.');
      });
  })
  describe('PATCH /artists/:artistId', () => {
    test('admin should be able to update an artist by its ID.', async () => {
      const { _id: artistId } = artists[0];
      const updatedArtist = {
        yearFormed: 2020,
        genre: [ "r&b", "pop" ]
      };
      const response = await updateArtist({
        token: adminJWT,
        artistId,
        updatedArtist
      });
      const { status, body: { data: { artist } } } = response;
      expect(status).toBe(200);
      expect(artist).toBeDefined();
      expect(artist.name).toBe(artists[0].name);
      expect(artist.genre).toEqual(updatedArtist.genre);
      expect(artist.yearFormed).toBe(updatedArtist.yearFormed);
    });
    test('should error if a non-admin user try to update artist.',
      async () => {
        const { _id: artistId } = artists[0];
        const updatedArtist = {
          yearFormed: 2020,
          genre: [ "r&b", "pop" ]
        }
        const response = await updateArtist({
          token: bobJWT,
          artistId,
          updatedArtist
        });
        const { status, body: { message } } = response;
        expect(status).toBe(403);
        expect(message).toContain(
          'You do not have to permission to perform this action.');
      });
    test('should error if photo ID that admin tries to update is invalid.',
      async () => {
        const { _id: artistId } = artists[0];
        // set photo ID to a non existent ID
        const photoID = '663ad462ca6f48b5c12898ec';
        const updatedArtist = {
          photo: photoID
        }
        const response = await updateArtist({
          token: adminJWT,
          artistId,
          updatedArtist
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(`Photo "${photoID}" does not exist.`);
      });
    test('should error if all the fields specified to be updated are non ' +
      'permissiable fields.', async () => {
        const { _id: artistId } = artists[0];
        const updatedArtist = {
          age: 27,
          hobbies: [ 'singing', 'playing guitar' ]
        }
        const response = await updateArtist({
          token: adminJWT,
          artistId,
          updatedArtist
        });
        const { status, body: { message } } = response;
        expect(status).toBe(400);
        expect(message).toContain(
          `You have not provided any permissible fields for updating`);
      });
  })
});

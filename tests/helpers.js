import request from 'supertest';
import app from '../app.js';

const apiVersion = '/api/v1';

const ping = async () => {
  const response = await request(app)
    .get(`${apiVersion}/ping`)
    .expect(200);
  return response;
}

const registerUser = async ({ newUser } = {}) => {
  const response = await request(app)
    .post(`${apiVersion}/auth/signup`)
    .send(newUser);
  return response;
}

const loginUser = async ({ email, password } = {}) => {
  const response = await request(app)
    .post(`${apiVersion}/auth/login`)
    .send({ email, password });
  return response;
}

const logoutUser = async ({ token } = {}) => {
  const response = await request(app)
    .post(`${apiVersion}/auth/logout`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const sendPasswordResetRequest = async ({ email } = {}) => {
  const response = await request(app)
    .post(`${apiVersion}/auth/forgotPassword`)
    .send({ email });
  return response;
}

const resetPassword = async ({
  newPassword, confirmPassword, passwordResetToken
} = {}) => {
  const response = await request(app)
    .patch(`${apiVersion}/auth/resetPassword/${passwordResetToken}`)
    .send({
      newPassword,
      confirmPassword
    });
  return response;
}

const getUsers = async ({ token } = {}) => {
  const response = await request(app)
    .get(`${apiVersion}/users`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const getUser = async ({ userId, token } = {}) => {
  const response = await request(app)
    .get(`${apiVersion}/users/${userId}`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const getUserProfile = async ({ token } = {}) => {
  const response = await request(app)
    .get(`${apiVersion}/users/profile`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const updateUserProfile = async ({ token, updatedProfile } = {}) => {
  const response = await request(app)
    .patch(`${apiVersion}/users/profile`)
    .send({
      ...updatedProfile
    })
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const deactivateUser = async ({ token } = {}) => {
  const response = await request(app)
    .delete(`${apiVersion}/users/profile`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const updatePassword = async ({
  token, newPassword, confirmPassword, currentPassword
} = {}) => {
  const response = await request(app)
    .patch(`${apiVersion}/users/profile/password`)
    .send({
      newPassword,
      confirmPassword,
      currentPassword
    })
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const registerUsers = async ({ users }) => {
  const promises = users.map(async newUser => {
    const res = await registerUser({ newUser });
    const { body: { data: { user } } } = res;
    return user;
  });
  return Promise.all(promises);
}

const uploadFile = async ({ filePath, type, token } = {}) => {
  const response = await request(app)
    .post(`${apiVersion}/files/upload`)
    .attach('file', filePath, { filename: 'file', contentType: type })
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const deleteFile = async ({ filename, token } = {}) => {
  const response = await request(app)
    .delete(`${apiVersion}/files/${filename}`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const createArtist = async ({ newArtist, token } = {}) => {
  const response = await request(app)
    .post(`${apiVersion}/artists`)
    .send(newArtist)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const createArtists = async ({ artists, token }) => {
  const promises = artists.map(async newArtist => {
    const artistData = { ...newArtist };
    const { body: { data: { file: { id: photo } } } } = await uploadFile({
      filePath: newArtist.photo, type: 'image/jpeg', token
    });
    artistData.photo = photo;
    const res = await createArtist({ newArtist: artistData, token });
    const { body: { data: { artist } } } = res;
    return artist;
  });
  return Promise.all(promises);
}

const getArtist = async ({ artistId, token } = {}) => {
  const response = await request(app)
    .get(`${apiVersion}/artists/${artistId}`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const deleteArtist = async ({ artistId, token } = {}) => {
  const response = await request(app)
    .delete(`${apiVersion}/artists/${artistId}`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const updateArtist = async ({ artistId, token, updatedArtist } = {}) => {
  const response = await request(app)
    .patch(`${apiVersion}/artists/${artistId}`)
    .send(updatedArtist)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const getArtists = async ({ token, queryParams } = {}) => {
  let requestBuilder = request(app)
    .get(`${apiVersion}/artists`)
    .set('Authorization', `Bearer ${token}`);
  if (queryParams) {
    requestBuilder = requestBuilder.query(queryParams);
  }
  const response = await requestBuilder;
  return response;
}

const createAlbum = async ({ newAlbum, token } = {}) => {
  const response = await request(app)
    .post(`${apiVersion}/albums`)
    .send(newAlbum)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const createAlbumData = async ({ newAlbum, artists, token } = {}) => {
  const albumData = { ...newAlbum };
  const { body: { data: { file: { id: photo } } } } = await uploadFile({
    filePath: newAlbum.photo, type: 'image/jpeg', token
  });
  albumData.photo = photo;
  const artistIds = albumData.artists.map(artistName => {
    const { _id: artistId } = artists.find(
      artist => artistName === artist.name);
    return artistId;
  });
  albumData.artists = artistIds;
  return albumData;
}

const createAlbums = async ({ albums, token, artists }) => {
  const promises = albums.map(async newAlbum => {
    const albumData = await createAlbumData({ newAlbum, artists, token });
    const res = await createAlbum({ newAlbum: albumData, token });
    const { body: { data: { album } } } = res;
    return album;
  });
  return Promise.all(promises);
}

const getAlbum = async ({ albumId, token } = {}) => {
  const response = await request(app)
    .get(`${apiVersion}/albums/${albumId}`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const getAlbums = async ({ token, queryParams } = {}) => {
  let requestBuilder = request(app)
    .get(`${apiVersion}/albums`)
    .set('Authorization', `Bearer ${token}`);
  if (queryParams) {
    requestBuilder = requestBuilder.query(queryParams);
  }
  const response = await requestBuilder;
  return response;
}

const deleteAlbum = async ({ albumId, token } = {}) => {
  const response = await request(app)
    .delete(`${apiVersion}/albums/${albumId}`)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const updateAlbum = async ({ albumId, token, updatedAlbum } = {}) => {
  const response = await request(app)
    .patch(`${apiVersion}/albums/${albumId}`)
    .send(updatedAlbum)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const createSong = async ({ newSong, token } = {}) => {
  const response = await request(app)
    .post(`${apiVersion}/songs`)
    .send(newSong)
    .set('Authorization', `Bearer ${token}`);
  return response;
}

const createSongData = async ({ newSong, artists, albums, token } = {}) => {
  const songData = { ...newSong };
  if (newSong.photo) {
    const { body: { data: { file: { id: photo } } } } = await uploadFile({
      filePath: newSong.photo, type: 'image/jpeg', token
    });
    songData.photo = photo;
  }
  const { body: { data: { file: { id: audioFile } } } } = await uploadFile({
    filePath: newSong.audioFile, type: 'audio/mp3', token
  });
  songData.audioFile = audioFile;
  const artistIds = newSong.artists.map(artistName => {
    const { _id: artistId } = artists.find(
      artist => artistName === artist.name);
    return artistId;
  });
  songData.artists = artistIds;
  if (newSong.featuredArtists) {
    const featuredArtistIds = newSong.featuredArtists.map(
      featuredArtistName => {
        const { _id: artistId } = artists.find(
          artist => featuredArtistName === artist.name);
        return artistId;
      });
    songData.featuredArtists = featuredArtistIds;
  }
  if (newSong.albums) {
    const albumIds = newSong.albums.map(albumTitle => {
      const { _id: albumId } = albums.find(
        album => albumTitle === album.title);
      return albumId;
    });
    songData.albums = albumIds;
  }
  return songData;
}

const createSongs = async ({ songs, albums, token, artists }) => {
  const promises = songs.map(async newSong => {
    const songData = await createSongData({ newSong, albums, token, artists });
    const res = await createSong({ newSong: songData, token });
    const { body: { data: { song } } } = res;
    return song;
  });
  return Promise.all(promises);
}

export {
  apiVersion, createAlbum, createAlbumData, createAlbums, createArtist,
  createArtists, createSong, createSongData, createSongs, deactivateUser,
  deleteAlbum, deleteArtist, deleteFile, getAlbum, getAlbums, getArtist,
  getArtists, getUser, getUserProfile, getUsers, loginUser, logoutUser, ping,
  registerUser, registerUsers, resetPassword, sendPasswordResetRequest,
  updateAlbum, updateArtist, updatePassword, updateUserProfile, uploadFile
};

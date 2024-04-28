import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/create-response.js';
import CustomError from '../utils/custom-error.js';
import filterPlaylistData from '../utils/filter-data.js';
import Playlist from '../models/playlist-model.js';
import validateSongsExist from '../utils/validate-songs-exist.js';

const addPlaylist = asyncErrorHandler(async (req, res, next) => {
  const { _id: userId } = req.user;
  const { songs } = req.body;
  const options = {
    ...req.body,
    user: String(userId)
  };
  if (songs) {
    const { uniqueSongIds, e } = await validateSongsExist(songs);
    if (e) {
      return next(e);
    }
    if (uniqueSongIds) {
      options.songs = uniqueSongIds;
    }
  }
  const playlist = new Playlist(options);
  await playlist.populate([
    'user',
    {
      path: 'songs',
      populate: [{
        path: 'artists',
        model: 'Artist'
      }, {
        path: 'featuredArtists',
        model: 'Artist'
      }, {
        path: 'photo',
        model: 'File'
      }, {
        path: 'audioFile',
        model: 'File'
      }]
    }
  ]);
  const newPlaylist = await playlist.save({
    timestamps: { createdAt: true, updatedAt: false }
  });
  return createResponse({
    data: { playlist: newPlaylist }, res, statusCode: 201
  });
});

// eslint-disable-next-line no-unused-vars
const getPlaylists = asyncErrorHandler(async (req, res, next) => {
  const { _id: userId } = req.user;
  const { title, user } = req.query;
  const query = {};
  if (title) {
    query.title = { $regex: new RegExp(title, "i") };
  }
  if (user && user !== String(userId)) {
    query.user = user;
    query.isPublic = true;
  } else {
    query.user = String(userId);
  }
  const playlists = await Playlist.find(query).populate([
    'user',
    {
      path: 'songs',
      populate: [{
        path: 'artists',
        model: 'Artist'
      }, {
        path: 'featuredArtists',
        model: 'Artist'
      }, {
        path: 'photo',
        model: 'File'
      }, {
        path: 'audioFile',
        model: 'File'
      }]
    }
  ]);
  return createResponse({
    count: playlists.length, data: { playlists }, res, statusCode: 200
  });
});

const getPlaylist = asyncErrorHandler(async (req, res, next) => {
  const { playlistId: id } = req.params;
  const playlist = await Playlist.findById(id).populate([
    'user',
    {
      path: 'songs',
      populate: [{
        path: 'artists',
        model: 'Artist'
      }, {
        path: 'featuredArtists',
        model: 'Artist'
      }, {
        path: 'photo',
        model: 'File'
      }, {
        path: 'audioFile',
        model: 'File'
      }]
    }
  ]);
  if (!playlist) {
    const e = new CustomError(`Playlist with ID "${id}" not found.`, 404);
    return next(e);
  }
  const { _id: userId } = req.user;
  const { _id: playlistUserId } = playlist.user;
  if (String(playlistUserId) !== String(userId) && !playlist.isPublic) {
    const e = new CustomError(`The playlist "${playlist.title}" you are ` +
      `trying to access is private.`, 403);
    return next(e);
  }
  return createResponse({ data: { playlist }, res, statusCode: 200 });
});

const deletePlaylist = asyncErrorHandler(async (req, res, next) => {
  const { playlistId: id } = req.params;
  const playlist = await Playlist.findById(id);
  if (!playlist) {
    const e = new CustomError(`Playlist with ID "${id}" not found.`, 404);
    return next(e);
  }
  const { _id: userId } = req.user;
  const { _id: playlistUserId } = playlist.user;
  if (String(playlistUserId) !== String(userId)) {
    const e = new CustomError(`You do not have access to delete the playlist ` +
      `"${playlist.title}".`, 403);
    return next(e);
  }
  await Playlist.findByIdAndDelete(id);
  return createResponse({ data: { playlist: null }, res, statusCode: 200 });
});

const updatePlaylist = asyncErrorHandler(async (req, res, next) => {
  const { playlistId: id } = req.params;
  const playlist = await Playlist.findById(id);
  if (!playlist) {
    const e = new CustomError(`Playlist with ID "${id}" not found.`, 404);
    return next(e);
  }
  const { _id: userId } = req.user;
  const { _id: playlistUserId } = playlist.user;
  if (String(playlistUserId) !== String(userId)) {
    const e = new CustomError(`You do not have access to update the playlist ` +
      `"${playlist.title}".`, 403);
    return next(e);
  }
  const { songs } = req.body;
  const bodyCopy = { ...req.body };
  if (songs) {
    const { uniqueSongIds, e } = await validateSongsExist(songs);
    if (e) {
      return next(e);
    }
    if (uniqueSongIds) {
      bodyCopy.songs = uniqueSongIds;
    }
  }
  const allowedFields = ['title', 'description', 'isPublic', 'songs'];
  const filteredData = filterPlaylistData({ data: bodyCopy, allowedFields });
  if (Object.keys(filteredData).length === 0) {
    const e = new CustomError('You have not provided any permissible fields ' +
      'for updating, or the fields you have provided are not within the ' +
      'allowable list for updates.', 400);
    return next(e);
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(id, filteredData, {
    new: true,
    runValidators: true,
    timestamps: { createdAt: false, updatedAt: true }
  }).populate([
    'user',
    {
      path: 'songs',
      populate: [{
        path: 'artists',
        model: 'Artist'
      }, {
        path: 'featuredArtists',
        model: 'Artist'
      }, {
        path: 'photo',
        model: 'File'
      }, {
        path: 'audioFile',
        model: 'File'
      }]
    }
  ]);
  return createResponse({
    data: { playlist: updatedPlaylist }, res, statusCode: 200
  });
});

export {
  addPlaylist,
  deletePlaylist,
  getPlaylist,
  getPlaylists,
  updatePlaylist
};

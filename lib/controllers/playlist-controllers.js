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
    const { uniqueSongs, e } = await validateSongsExist(songs);
    if (e) {
      return next(e);
    }
    if (uniqueSongs) {
      options.songs = uniqueSongs;
    }
  }
  const playlist = new Playlist(options);
  await playlist.populate([
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
  const { user } = req.query;
  const query = {};
  if (user && user !== String(userId)) {
    query.user = user;
    query.isPublic = true;
  } else {
    query.user = String(userId);
  }
  const playlists = await Playlist.find(query).populate([
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
    const { uniqueSongs, e } = await validateSongsExist(songs);
    if (e) {
      return next(e);
    }
    if (uniqueSongs) {
      bodyCopy.songs = uniqueSongs;
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

const addSongsToPlaylist = asyncErrorHandler(async (req, res, next) => {
  const { playlistId: id } = req.params;
  const playlist = await Playlist.findById(id);
  if (!playlist) {
    const e = new CustomError(`Playlist with ID "${id}" not found.`, 404);
    return next(e);
  }
  const { _id: userId } = req.user;
  const { _id: playlistUserId } = playlist.user;
  if (String(playlistUserId) !== String(userId)) {
    const e = new CustomError(`You do not have access to add songs to the ` +
      `playlist "${playlist.title}".`, 403);
    return next(e);
  }
  let { songs } = req.body;
  if(!songs) {
    const e = new CustomError(`Please specify a song or list of songs to ` +
      `add to the playlist "${playlist.title}".`, 400);
    return next(e);
  }
  songs = Array.isArray(songs) ? songs : [ songs ]
  if (songs) {
    const { uniqueSongs, e } = await validateSongsExist(songs);
    if (e) {
      return next(e);
    }
    if (uniqueSongs) {
      uniqueSongs.forEach(songId => {
        if (!playlist.songs.includes(songId)) {
          playlist.songs.push(songId);
        }
      });
    }
  }
  await playlist.save();
  await playlist.populate('songs');

  return createResponse({
    data: { playlist }, res, statusCode: 200
  });
});

const removeSongsFromPlaylist = asyncErrorHandler(async (req, res, next) => {
  const { playlistId: id } = req.params;
  const playlist = await Playlist.findById(id);
  if (!playlist) {
    const e = new CustomError(`Playlist with ID "${id}" not found.`, 404);
    return next(e);
  }
  const { _id: userId } = req.user;
  const { _id: playlistUserId } = playlist.user;
  if (String(playlistUserId) !== String(userId)) {
    const e = new CustomError(`You do not have access to remove songs from ` +
      `the playlist "${playlist.title}".`, 403);
    return next(e);
  }
  let { songs } = req.body;
  if(!songs) {
    const e = new CustomError(`Please specify a song or list of songs to ` +
      `remove from the playlist "${playlist.title}".`, 400);
    return next(e);
  }
  songs = Array.isArray(songs) ? songs : [ songs ]
  if (songs) {
    const { uniqueSongs, e } = await validateSongsExist(songs);
    if (e) {
      return next(e);
    }
    if (uniqueSongs) {
      uniqueSongs.forEach(songId => {
        const index = playlist.songs.indexOf(songId);
        if (index !== -1) {
          playlist.songs.splice(index, 1);
        }
      });
    }
  }
  await playlist.save();
  await playlist.populate('songs');

  return createResponse({
    data: { playlist }, res, statusCode: 200
  });
});

export {
  addPlaylist,
  addSongsToPlaylist,
  deletePlaylist,
  getPlaylist,
  getPlaylists,
  removeSongsFromPlaylist,
  updatePlaylist
};

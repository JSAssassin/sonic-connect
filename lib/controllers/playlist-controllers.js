import Playlist from '../models/playlist-model.js';
import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/createResponse.js';
import CustomError from '../utils/custom-error.js';


// eslint-disable-next-line no-unused-vars
const addPlaylist = asyncErrorHandler(async (req, res, next) => {
  const newPlaylist = await Playlist.create(req.body.playlist);
  return createResponse({
    data: { playlist: newPlaylist }, res, statusCode: 201
  });
});

// eslint-disable-next-line no-unused-vars
const getPlaylists = asyncErrorHandler(async (req, res, next) => {
  const query = {};
  const { title, isPublic } = req.query;
  if (title) {
    query.title = title;
  }
  if (isPublic) {
    query.isPublic = isPublic;
  }
  const playlists = await Playlist.find(query);
  return createResponse({
    count: playlists.length, data: { playlists }, res, statusCode: 200
  });
});

const getPlaylist = asyncErrorHandler(async (req, res, next) => {
  const { playlistId: id } = req.params;
  const playlist = await Playlist.findById(id);
  if (!playlist) {
    const e = new CustomError(`Playlist with id "${id}" not found.`, 404);
    return next(e);
  }
  return createResponse({ data: { playlist }, res, statusCode: 200 });
});

const deletePlaylist = asyncErrorHandler(async (req, res, next) => {
  const { playlistId: id } = req.params;
  const deletedPlaylist = await Playlist.findByIdAndDelete(id);
  if (!deletedPlaylist) {
    const e = new CustomError(`Playlist with id "${id}" not found.`, 404);
    return next(e);
  }
  return createResponse({ data: { playlist: null }, res, statusCode: 200 });
});

const updatePlaylist = asyncErrorHandler(async (req, res, next) => {
  const { playlistId: id } = req.params;
  const { _id, ...rest } = req.body;
  const update = { ...rest };
  const updatedPlaylist = await Playlist.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true
  });
  if (!updatedPlaylist) {
    const e = new CustomError(`Playlist with id "${id}" not found.`, 404);
    return next(e);
  }
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

import Playlist from '../models/playlist-model.js';
import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/createResponse.js';
import CustomError from '../utils/custom-error.js';


// eslint-disable-next-line no-unused-vars
const addPlaylist = asyncErrorHandler(async (req, res, next) => {
  const { _id: userId } = req.user;
  const options = {
    ...req.body,
    user: String(userId)
  };
  const playlist = new Playlist(options);
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
  const playlists = await Playlist.find(query);
  return createResponse({
    count: playlists.length, data: { playlists }, res, statusCode: 200
  });
});

const getPlaylist = asyncErrorHandler(async (req, res, next) => {
  const { playlistId: id } = req.params;
  const playlist = await Playlist.findById(id);
  if (!playlist) {
    const e = new CustomError(`Playlist with ID "${id}" not found.`, 404);
    return next(e);
  }
  const { _id: userId } = req.user;
  if (playlist.user !== userId && !playlist.isPublic) {
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
  if (playlist.user !== userId) {
    const e = new CustomError(`You do not have access to delete the playlist ` +
      `"${playlist.title}".`, 403);
    return next(e);
  }
  await Playlist.findByIdAndDelete(id);
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
    const e = new CustomError(`Playlist with ID "${id}" not found.`, 404);
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

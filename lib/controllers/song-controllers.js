import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/createResponse.js';
import CustomError from '../utils/custom-error.js';
import Song from '../models/song-model.js';


// eslint-disable-next-line no-unused-vars
const addSong = asyncErrorHandler(async (req, res, next) => {
  const newSong = await Song.create(req.body.song);
  createResponse({ data: { song: newSong }, res, statusCode: 201 });
});

// eslint-disable-next-line no-unused-vars
const getSongs = asyncErrorHandler(async (req, res, next) => {
  const query = {};
  const {title, genre, artist, album} = req.query;
  if(title) {
    query.name = title;
  }
  if(genre) {
    const genreArray = genre.split(',').map(genreString => genreString.trim());
    query.genre = { $in: genreArray };
  }
  if(artist) {
    query.artist = artist;
  }
  if(album) {
    query.album = album;
  }
  const songs = await Song.find(query);
  createResponse({
    count: songs.length, data: { songs }, res, statusCode: 200
  });
});

const getSong = asyncErrorHandler(async (req, res, next) => {
  const {songId: id} = req.params;
  const song = await Song.findById(id);
  if (!song) {
    const err = new CustomError(`Song with id "${id}" not found.`, 404);
    next(err);
  }
  createResponse({ data: { song }, res, statusCode: 200 });
});

const deleteSong = asyncErrorHandler(async (req, res, next) => {
  const {songId: id} = req.params;
  const deletedSong = await Song.findByIdAndDelete(id);
  if (!deletedSong) {
    const err = new CustomError(`Song with id "${id}" not found.`, 404);
    next(err);
  }
  createResponse({ data: { song: null }, res, statusCode: 200 });
});

const updateSong = asyncErrorHandler(async (req, res, next) => {
  const {songId: id} = req.params;
  const { _id, ...rest } = req.body;
  const update = {...rest};
  const updatedSong = await Song.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true
  });
  if (!updatedSong) {
    const err = new CustomError(`Song with id "${id}" not found.`, 404);
    next(err);
  }
  createResponse({ data: { song: updatedSong }, res, statusCode: 200 });
});

export {
  addSong,
  deleteSong,
  getSong,
  getSongs,
  updateSong
};

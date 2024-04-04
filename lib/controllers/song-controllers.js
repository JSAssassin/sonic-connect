import asyncErrorHandler from '../utils/async-error-handler.js';
import Album from '../models/album-model.js';
import Artist from '../models/artist-model.js';
import createResponse from '../utils/create-response.js';
import CustomError from '../utils/custom-error.js';
import filterSongData from '../utils/filter-data.js';
import Song from '../models/song-model.js';


// eslint-disable-next-line no-unused-vars
const addSong = asyncErrorHandler(async (req, res, next) => {
  const { album: albumId, artist: artistId } = req.body;
  if (albumId) {
    const album = await Album.findById(albumId);
    if (!album) {
      const e = new CustomError(`Album ID "${albumId}" does not exist.`, 400);
      return next(e);
    }
  }
  if (artistId) {
    const artist = await Artist.findById(artistId);
    if (!artist) {
      const e = new CustomError(`Artist ID "${artistId}" does not exist.`, 404);
      return next(e);
    }
  }
  const song = new Song({ ...req.body });
  const newSong = await song.save({
    timestamps: { createdAt: true, updatedAt: false }
  });
  return createResponse({ data: { song: newSong }, res, statusCode: 201 });
});

// eslint-disable-next-line no-unused-vars
const getSongs = asyncErrorHandler(async (req, res, next) => {
  const query = {};
  const { title, genre, artist, album } = req.query;
  if (title) {
    // case-insensitive search for partial matches
    query.title = { $regex: new RegExp(title, "i") };
  }
  if (genre) {
    const genreArray = genre.split(',').map(genreString => genreString.trim());
    query.genre = { $in: genreArray };
  }
  if (artist) {
    query.artist = artist;
  }
  if (album) {
    query.album = album;
  }
  const songs = await Song.find(query);
  return createResponse({
    count: songs.length, data: { songs }, res, statusCode: 200
  });
});

const getSong = asyncErrorHandler(async (req, res, next) => {
  const { songId: id } = req.params;
  const song = await Song.findById(id);
  if (!song) {
    const e = new CustomError(`Song with ID "${id}" not found.`, 404);
    return next(e);
  }
  return createResponse({ data: { song }, res, statusCode: 200 });
});

const deleteSong = asyncErrorHandler(async (req, res, next) => {
  const { songId: id } = req.params;
  const deletedSong = await Song.findByIdAndDelete(id);
  if (!deletedSong) {
    const e = new CustomError(`Song with ID "${id}" not found.`, 404);
    return next(e);
  }
  return createResponse({ data: { song: null }, res, statusCode: 200 });
});

const updateSong = asyncErrorHandler(async (req, res, next) => {
  const { songId: id } = req.params;
  const allowedFields = [
    'title', 'genre', 'duration', 'artist', 'album', 'releaseDate'
  ];
  const filteredData = filterSongData({ data: req.body, allowedFields });
  if (Object.keys(filteredData).length === 0) {
    const e = new CustomError('You have not provided any permissible fields ' +
      'for updating, or the fields you have provided are not within the ' +
      'allowable list for updates.', 400);
    return next(e);
  }
  const { artist: artistId, album: albumId } = filteredData;
  if (albumId) {
    const album = await Album.findById(albumId);
    if (!album) {
      const e = new CustomError(`Album ID "${albumId}" does not exist.`, 404);
      return next(e);
    }
  }
  if (artistId) {
    const artist = await Artist.findById(artistId);
    if (!artist) {
      const e = new CustomError(`Artist ID "${artistId}" does not exist.`, 404);
      return next(e);
    }
  }
  const updatedSong = await Song.findByIdAndUpdate(id, filteredData, {
    runValidators: true,
    timestamps: { createdAt: false, updatedAt: true },
    new: true
  });
  if (!updatedSong) {
    const e = new CustomError(`Song with ID "${id}" not found.`, 404);
    return next(e);
  }
  return createResponse({ data: { song: updatedSong }, res, statusCode: 200 });
});

export {
  addSong,
  deleteSong,
  getSong,
  getSongs,
  updateSong
};

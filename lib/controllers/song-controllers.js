import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/create-response.js';
import CustomError from '../utils/custom-error.js';
import filterSongData from '../utils/filter-data.js';
import Song from '../models/song-model.js';
import validateAlbumExists from '../utils/validate-album-exists.js';
import validateArtistsExist from '../utils/validate-artists-exist.js';
import validateFileExists from '../utils/validate-file-exists.js';


const addSong = asyncErrorHandler(async (req, res, next) => {
  const {
    album: albumId, artists, featuredArtists, photo: photoId,
    audioFile: audioFileId
  } = req.body;
  const { uniqueArtists, e } = await validateArtistsExist(artists, 'artists');
  if (e) {
    return next(e);
  }
  const bodyCopy = { ...req.body };
  bodyCopy.artists = uniqueArtists;
  if (!await validateFileExists(photoId)) {
    const err = new CustomError(`Photo "${photoId}" does not exist.`, 400);
    return next(err);
  }
  if (!await validateFileExists(audioFileId)) {
    const err = new CustomError(
      `Autio file "${audioFileId}" does not exist.`, 400);
    return next(err);
  }
  if (featuredArtists) {
    const {
      uniqueArtists: uniqueFeaturedArtists, e: err
    } = await validateArtistsExist(featuredArtists, 'featuredArtists');
    if (err) {
      return next(err);
    }
    bodyCopy.featuredArtists = uniqueFeaturedArtists;
  }
  if (albumId) {
    if (!await validateAlbumExists(albumId)) {
      const err = new CustomError(`Album ID "${albumId}" does not exist.`, 400);
      return next(err);
    }
  }
  const song = new Song({ ...bodyCopy });
  await song.populate([
    'photo',
    'artists',
    'featuredArtists',
    'audioFile',
    {
      path: 'album',
      populate: {
        path: 'artists',
        model: 'Artist'
      }
    }
  ]);
  const newSong = await song.save({
    timestamps: { createdAt: true, updatedAt: false }
  });
  return createResponse({ data: { song: newSong }, res, statusCode: 201 });
});

// eslint-disable-next-line no-unused-vars
const getSongs = asyncErrorHandler(async (req, res, next) => {
  const query = {};
  const { title, genre, artists, featuredArtists, album } = req.query;
  if (title) {
    // case-insensitive search for partial matches
    query.title = { $regex: new RegExp(title, "i") };
  }
  if (genre) {
    const genreArray = genre.split(',').map(genreString => genreString.trim());
    query.genre = { $in: genreArray };
  }
  if (artists) {
    const artistsArray = artists.split(',').map(artist => artist.trim());
    query.artists = { $in: artistsArray };
  }
  if (featuredArtists) {
    const featuredArtistsArray = featuredArtists.split(',').map(
      featuredArtist => featuredArtist.trim());
    query.featuredArtists = { $in: featuredArtistsArray };
  }
  if (album) {
    query.album = album;
  }
  const songs = await Song.find(query).populate([
    'artists',
    'featuredArtists',
    'photo',
    'audioFile',
    {
      path: 'album',
      populate: {
        path: 'artists',
        model: 'Artist'
      }
    }
  ]);
  return createResponse({
    count: songs.length, data: { songs }, res, statusCode: 200
  });
});

const getSong = asyncErrorHandler(async (req, res, next) => {
  const { songId: id } = req.params;
  const song = await Song.findById(id).populate([
    'artists',
    'featuredArtists',
    'photo',
    'audioFile',
    {
      path: 'album',
      populate: {
        path: 'artists',
        model: 'Artist'
      }
    }
  ]);
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
    'title', 'genre', 'duration', 'artists', 'album', 'releaseDate',
    'featuredArtists', 'photo', 'audioFile',
  ];
  const {
    artists, album: albumId, featuredArtists, photo: photoId,
    audioFile: audioFileId
  } = req.body;
  const bodyCopy = { ...req.body };
  if (artists) {
    const { uniqueArtists, e } = await validateArtistsExist(artists, 'artists');
    if (e) {
      return next(e);
    }
    bodyCopy.artists = uniqueArtists;
  }
  if (photoId) {
    if (!await validateFileExists(photoId)) {
      const err = new CustomError(`Photo "${photoId}" does not exist.`, 400);
      return next(err);
    }
  }
  if (audioFileId) {
    if (!await validateFileExists(audioFileId)) {
      const err = new CustomError(
        `Audio file "${audioFileId}" does not exist.`, 400);
      return next(err);
    }
  }
  if (featuredArtists) {
    const {
      uniqueArtists: uniqueFeaturedArtists, e: err
    } = await validateArtistsExist(featuredArtists, 'featuredArtists');
    if (err) {
      return next(err);
    }
    bodyCopy.featuredArtists = uniqueFeaturedArtists;
  }
  if (albumId) {
    if (!await validateAlbumExists(albumId)) {
      const e = new CustomError(`Album ID "${albumId}" does not exist.`, 400);
      return next(e);
    }
  }
  const filteredData = filterSongData({ data: bodyCopy, allowedFields });
  if (Object.keys(filteredData).length === 0) {
    const e = new CustomError('You have not provided any permissible fields ' +
      'for updating, or the fields you have provided are not within the ' +
      'allowable list for updates.', 400);
    return next(e);
  }
  const updatedSong = await Song.findByIdAndUpdate(id, filteredData, {
    runValidators: true,
    timestamps: { createdAt: false, updatedAt: true },
    new: true
  }).populate([
    'artists',
    'featuredArtists',
    'photo',
    'audioFile',
    {
      path: 'album',
      populate: {
        path: 'artists',
        model: 'Artist'
      }
    }
  ]);
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

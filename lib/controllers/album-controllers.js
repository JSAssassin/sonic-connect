import Album from '../models/album-model.js';
import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/create-response.js';
import CustomError from '../utils/custom-error.js';
import filterAlbumData from '../utils/filter-data.js';
import validateArtistExists from '../utils/validate-artist-exists.js';


const addAlbum = asyncErrorHandler(async (req, res, next) => {
  const { artist: artistId } = req.body;
  if(!await validateArtistExists(artistId)) {
    const e = new CustomError(`Artist ID "${artistId}" does not exist.`, 400);
    return next(e);
  }
  const album = new Album({ ...req.body });
  await album.populate('artist');
  const newAlbum = await album.save({
    timestamps: { createdAt: true, updatedAt: false }
  });
  return createResponse({ data: { album: newAlbum }, res, statusCode: 201 });
});

// eslint-disable-next-line no-unused-vars
const getAlbums = asyncErrorHandler(async (req, res, next) => {
  const query = {};
  const { title, genre, artist } = req.query;
  if (title) {
    query.title = { $regex: new RegExp(title, "i") };
  }
  if (genre) {
    const genreArray = genre.split(',').map(genreString => genreString.trim());
    query.genre = { $in: genreArray };
  }
  if (artist) {
    query.artist = artist;
  }
  const albums = await Album.find(query)
    .populate('artist');
  return createResponse({
    count: albums.length, data: { albums }, res, statusCode: 200
  });
});

const getAlbum = asyncErrorHandler(async (req, res, next) => {
  const { albumId: id } = req.params;
  const album = await Album.findById(id).populate('artist');
  if (!album) {
    const e = new CustomError(`Album with ID "${id}" not found.`, 404);
    return next(e);
  }
  return createResponse({ data: { album }, res, statusCode: 200 });
});

const deleteAlbum = asyncErrorHandler(async (req, res, next) => {
  const { albumId: id } = req.params;
  const deletedAlbum = await Album.findByIdAndDelete(id);
  if (!deletedAlbum) {
    const e = new CustomError(`Album with ID "${id}" not found.`, 404);
    return next(e);
  }
  return createResponse({ data: { album: null }, res, statusCode: 200 });
});

const updateAlbum = asyncErrorHandler(async (req, res, next) => {
  const { albumId: id } = req.params;
  const allowedFields = [
    'title', 'description', 'genre', 'artist', 'releaseDate'
  ];
  const filteredData = filterAlbumData({ data: req.body, allowedFields });
  if (Object.keys(filteredData).length === 0) {
    const e = new CustomError('You have not provided any permissible fields ' +
      'for updating, or the fields you have provided are not within the ' +
      'allowable list for updates.', 400);
    return next(e);
  }
  const { artist: artistId } = filteredData;
  if(artistId) {
    if(!await validateArtistExists(artistId)) {
      const e = new CustomError(`Artist ID "${artistId}" does not exist.`, 400);
      return next(e);
    }
  }
  const updatedAlbum = await Album.findByIdAndUpdate(id, filteredData, {
    new: true,
    runValidators: true,
    timestamps: { createdAt: false, updatedAt: true }
  }).populate('artist');
  if (!updatedAlbum) {
    const e = new CustomError(`Album with ID "${id}" not found.`, 404);
    return next(e);
  }
  return createResponse({
    data: { album: updatedAlbum }, res, statusCode: 200
  });
});

export {
  addAlbum,
  deleteAlbum,
  getAlbum,
  getAlbums,
  updateAlbum
};

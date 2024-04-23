import Album from '../models/album-model.js';
import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/create-response.js';
import CustomError from '../utils/custom-error.js';
import filterAlbumData from '../utils/filter-data.js';
import validateArtistsExist from '../utils/validate-artists-exist.js';
import validateFileExists from '../utils/validate-file-exists.js';


const addAlbum = asyncErrorHandler(async (req, res, next) => {
  const { artists, photo: photoId } = req.body;
  const { uniqueArtists, e } = await validateArtistsExist(artists, 'artists');
  if (!await validateFileExists(photoId)) {
    const err = new CustomError(`Photo "${photoId}" does not exist.`, 400);
    return next(err);
  }
  if (e) {
    return next(e);
  }
  const bodyCopy = { ...req.body };
  if(uniqueArtists) {
    bodyCopy.artists = uniqueArtists;
  }
  const album = new Album({ ...bodyCopy });
  await album.populate(['artists', 'photo']);
  const newAlbum = await album.save({
    timestamps: { createdAt: true, updatedAt: false }
  });
  return createResponse({ data: { album: newAlbum }, res, statusCode: 201 });
});

// eslint-disable-next-line no-unused-vars
const getAlbums = asyncErrorHandler(async (req, res, next) => {
  const query = {};
  const { title, genre, artists } = req.query;
  if (title) {
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
  const albums = await Album.find(query)
    .populate(['artists', 'photo']);
  return createResponse({
    count: albums.length, data: { albums }, res, statusCode: 200
  });
});

const getAlbum = asyncErrorHandler(async (req, res, next) => {
  const { albumId: id } = req.params;
  const album = await Album.findById(id).populate(['artists', 'photo']);
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
    'title', 'description', 'genre', 'artists', 'releaseDate'
  ];
  const { artists, photo: photoId } = req.body;
  const bodyCopy = { ...req.body };
  if (artists) {
    const { uniqueArtists, e } = await validateArtistsExist(artists, 'artists');
    if (e) {
      return next(e);
    }
    if(uniqueArtists) {
      bodyCopy.artists = uniqueArtists;
    }
  }
  if(photoId) {
    if (!await validateFileExists(photoId)) {
      const err = new CustomError(`Photo "${photoId}" does not exist.`, 400);
      return next(err);
    }
  }
  const filteredData = filterAlbumData({ data: bodyCopy, allowedFields });
  if (Object.keys(filteredData).length === 0) {
    const e = new CustomError('You have not provided any permissible fields ' +
      'for updating, or the fields you have provided are not within the ' +
      'allowable list for updates.', 400);
    return next(e);
  }
  const updatedAlbum = await Album.findByIdAndUpdate(id, filteredData, {
    new: true,
    runValidators: true,
    timestamps: { createdAt: false, updatedAt: true }
  }).populate(['artists', 'photo']);
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

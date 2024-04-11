import Artist from '../models/artist-model.js';
import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/create-response.js';
import CustomError from '../utils/custom-error.js';
import filterArtistData from '../utils/filter-data.js';
import validatePhotoExists from '../utils/validate-photo-exists.js';


// eslint-disable-next-line no-unused-vars
const addArtist = asyncErrorHandler(async (req, res, next) => {
  const { photo: photoId } = req.body;
  if (!await validatePhotoExists(photoId)) {
    const err = new CustomError(`Photo ID "${photoId}" does not exist.`, 400);
    return next(err);
  }
  const artist = new Artist({ ...req.body });
  await artist.populate('photo');
  const newArtist = await artist.save({
    timestamps: { createdAt: true, updatedAt: false }
  });
  return createResponse({ data: { artist: newArtist }, res, statusCode: 201 });
});

// eslint-disable-next-line no-unused-vars
const getArtists = asyncErrorHandler(async (req, res, next) => {
  const query = {};
  const { name, genre, origin } = req.query;

  if (name) {
    // case-insensitive search for partial matches
    query.name = { $regex: new RegExp(name, "i") };
  }
  if (genre) {
    const genreArray = genre.split(',').map(genreString => genreString.trim());
    query.genre = { $in: genreArray };
  }
  if (origin) {
    query.origin = { $regex: new RegExp(origin, "i") };
  }
  const artists = await Artist.find(query)
    .populate('photo');
  return createResponse({
    count: artists.length, data: { artists }, res, statusCode: 200
  });
});

const getArtist = asyncErrorHandler(async (req, res, next) => {
  const { artistId: id } = req.params;
  const artist = await Artist.findById(id)
    .populate('photo');
  if (!artist) {
    const e = new CustomError(`Artist with ID "${id}" not found.`, 404);
    return next(e);
  }
  return createResponse({ data: { artist }, res, statusCode: 200 });
});

const deleteArtist = asyncErrorHandler(async (req, res, next) => {
  const { artistId: id } = req.params;
  const deletedArtist = await Artist.findByIdAndDelete(id);
  if (!deletedArtist) {
    const e = new CustomError(`Artist with ID "${id}" not found.`, 404);
    return next(e);
  }
  return createResponse({ data: { artist: null }, res, statusCode: 200 });
});

const updateArtist = asyncErrorHandler(async (req, res, next) => {
  const { artistId: id } = req.params;
  const allowedFields = [
    'name', 'biography', 'origin', 'yearFormed', 'genre', 'photo'
  ];
  const { photo: photoId } = req.body;
  if(photoId) {
    if (!await validatePhotoExists(photoId)) {
      const err = new CustomError(`Photo ID "${photoId}" does not exist.`, 400);
      return next(err);
    }
  }
  const filteredData = filterArtistData({ data: req.body, allowedFields });
  if (Object.keys(filteredData).length === 0) {
    const e = new CustomError('You have not provided any permissible fields ' +
      'for updating, or the fields you have provided are not within the ' +
      'allowable list for updates.', 400);
    return next(e);
  }
  const updatedArtist = await Artist.findByIdAndUpdate(id, filteredData, {
    runValidators: true,
    timestamps: { createdAt: false, updatedAt: true },
    new: true
  }).populate('photo');
  if (!updatedArtist) {
    const e = new CustomError(`Artist with ID "${id}" not found.`, 404);
    return next(e);
  }
  return createResponse({
    data: { artist: updatedArtist }, res, statusCode: 200
  });
});

export {
  addArtist,
  deleteArtist,
  getArtist,
  getArtists,
  updateArtist
};

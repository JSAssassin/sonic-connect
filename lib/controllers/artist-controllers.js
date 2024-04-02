import Artist from '../models/artist-model.js';
import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/createResponse.js';
import CustomError from '../utils/custom-error.js';


// eslint-disable-next-line no-unused-vars
const addArtist = asyncErrorHandler(async (req, res, next) => {
  const artist = new Artist({ ...req.body });
  const newArtist = await artist.save({
    timestamps: { createdAt: true, updatedAt: false }
  });
  return createResponse({ data: { artist: newArtist }, res, statusCode: 201 });
});

// eslint-disable-next-line no-unused-vars
const getArtists = asyncErrorHandler(async (req, res, next) => {
  const query = {};
  const {name, genre, origin} = req.query;

  if(name) {
    // case-insensitive search for partial matches
    query.name = { $regex: new RegExp(name, "i") };
  }
  if(genre) {
    const genreArray = genre.split(',').map(genreString => genreString.trim());
    query.genre = { $in: genreArray };
  }
  if(origin) {
    query.origin = { $regex: new RegExp(origin, "i") };
  }
  const artists = await Artist.find(query);
  return createResponse({
    count: artists.length, data: { artists }, res, statusCode: 200
  });
});

const getArtist = asyncErrorHandler(async (req, res, next) => {
  const {artistId: id} = req.params;
  const artist = await Artist.findById(id);
  if (!artist) {
    const err = new CustomError(`Artist with id "${id}" not found.`, 404);
    return next(err);
  }
  return createResponse({ data: { artist }, res, statusCode: 200 });
});

const deleteArtist = asyncErrorHandler(async (req, res, next) => {
  const {artistId: id} = req.params;
  const deletedArtist = await Artist.findByIdAndDelete(id);
  if (!deletedArtist) {
    const err = new CustomError(`Artist with id "${id}" not found.`, 404);
    return next(err);
  }
  return createResponse({ data: { artist: null }, res, statusCode: 200 });
});

const updateArtist = asyncErrorHandler(async (req, res, next) => {
  const {artistId: id} = req.params;
  const { _id, ...rest } = req.body;
  const update = {...rest};
  const updatedArtist = await Artist.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true
  });
  if (!updatedArtist) {
    const err = new CustomError(`Artist with id "${id}" not found.`, 404);
    return next(err);
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

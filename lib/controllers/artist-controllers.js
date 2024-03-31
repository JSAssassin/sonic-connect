import Artist from '../models/artist-model.js';
import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/createResponse.js';
import CustomError from '../utils/custom-error.js';


// eslint-disable-next-line no-unused-vars
const addArtist = asyncErrorHandler(async (req, res, next) => {
  const newArtist = await Artist.create(req.body.artist);
  createResponse({ data: { artist: newArtist }, res, statusCode: 201 });
})

// eslint-disable-next-line no-unused-vars
const getArtists = asyncErrorHandler(async (req, res, next) => {
  const query = {};
  const {name, genre, origin} = req.query;
  if(name) {
    query.name = name;
  }
  if(genre) {
    query.genre = genre;
  }
  if(origin) {
    query.origin = origin;
  }
  const artists = await Artist.find(query);
  createResponse({
    count: artists.length, data: { artists }, res, statusCode: 200
  });
})

const getArtist = asyncErrorHandler(async (req, res, next) => {
  const {artistId: id} = req.params;
  const artist = await Artist.findById(id);
  if (!artist) {
    const err = new CustomError(`Artist with id "${id}" not found.`, 404);
    next(err);
  }
  createResponse({ data: { artist }, res, statusCode: 200 });
})

const deleteArtist = asyncErrorHandler(async (req, res, next) => {
  const {artistId: id} = req.params;
  const deletedArtist = await Artist.findByIdAndDelete(id);
  if (!deletedArtist) {
    const err = new CustomError(`Artist with id "${id}" not found.`, 404);
    next(err);
  }
  createResponse({ data: { artist: null }, res, statusCode: 200 });
})

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
    next(err);
  }
  createResponse({ data: { artist: updatedArtist }, res, statusCode: 200 });
})

export {
  addArtist,
  deleteArtist,
  getArtist,
  getArtists,
  updateArtist
};

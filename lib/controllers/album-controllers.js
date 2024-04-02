import Album from '../models/album-model.js';
import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/createResponse.js';
import CustomError from '../utils/custom-error.js';


// eslint-disable-next-line no-unused-vars
const addAlbum = asyncErrorHandler(async (req, res, next) => {
  const newAlbum = await Album.create(req.body.album);
  createResponse({ data: { album: newAlbum }, res, statusCode: 201 });
});

// eslint-disable-next-line no-unused-vars
const getAlbums = asyncErrorHandler(async (req, res, next) => {
  const query = {};
  const {title, genre, artist} = req.query;
  if(title) {
    query.title = title;
  }
  if(genre) {
    const genreArray = genre.split(',').map(genreString => genreString.trim());
    query.genre = { $in: genreArray };
  }
  if(artist) {
    query.artist = artist;
  }
  const albums = await Album.find(query);
  createResponse({
    count: albums.length, data: { albums }, res, statusCode: 200
  });
});

const getAlbum = asyncErrorHandler(async (req, res, next) => {
  const {albumId: id} = req.params;
  const album = await Album.findById(id);
  if (!album) {
    const err = new CustomError(`Album with id "${id}" not found.`, 404);
    next(err);
  }
  createResponse({ data: { album }, res, statusCode: 200 });
});

const deleteAlbum = asyncErrorHandler(async (req, res, next) => {
  const {albumId: id} = req.params;
  const deletedAlbum = await Album.findByIdAndDelete(id);
  if (!deletedAlbum) {
    const err = new CustomError(`Album with id "${id}" not found.`, 404);
    next(err);
  }
  createResponse({ data: { album: null }, res, statusCode: 200 });
});

const updateAlbum = asyncErrorHandler(async (req, res, next) => {
  const {albumId: id} = req.params;
  const { _id, ...rest } = req.body;
  const update = {...rest};
  const updatedAlbum = await Album.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true
  });
  if (!updatedAlbum) {
    const err = new CustomError(`Album with id "${id}" not found.`, 404);
    next(err);
  }
  createResponse({ data: { album: updatedAlbum }, res, statusCode: 200 });
});

export {
  addAlbum,
  deleteAlbum,
  getAlbum,
  getAlbums,
  updateAlbum
};

import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/createResponse.js';
import Artist from '../models/artist-model.js';


// eslint-disable-next-line no-unused-vars
const addArtist = asyncErrorHandler(async (req, res, next) => {
  const newArtist = await Artist.create(req.body.artist);
  createResponse({ data: { artist: newArtist }, res, statusCode: 201 });
})

export default addArtist;

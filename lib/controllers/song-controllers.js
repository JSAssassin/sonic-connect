import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/createResponse.js';
import Song from '../models/song-model.js';


// eslint-disable-next-line no-unused-vars
const addSong = asyncErrorHandler(async (req, res, next) => {
  const newSong = await Song.create(req.body.song);
  createResponse({ data: { song: newSong }, res, statusCode: 201 });
})

export default addSong;

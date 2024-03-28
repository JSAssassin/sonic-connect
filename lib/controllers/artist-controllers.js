import asyncErrorHandler from '../utils/async-error-handler.js';
import Artist from '../models/artist-model.js';


// eslint-disable-next-line no-unused-vars
const addArtist = asyncErrorHandler(async (req, res, next) => {
  const newArtist = await Artist.create(req.body.artist);
  return res.status(201).json({
    status: "success",
    data: {
      artist: newArtist
    }
  })
})

export default addArtist;

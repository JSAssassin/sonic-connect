import asyncErrorHandler from '../utils/async-error-handler.js';
import Song from '../models/song-model.js';


// eslint-disable-next-line no-unused-vars
const addSong = asyncErrorHandler(async (req, res, next) => {
  const newSong = await Song.create(req.body.song);
  return res.status(201).json({
    status: "success",
    data: {
      song: newSong
    }
  })
})

export default addSong;

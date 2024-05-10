import CustomError from './custom-error.js';
import Song from '../models/song-model.js';

const getExistingSongsByIds = async songs => Song.find({
  '_id': { $in: songs }
});

const getNonExistentSongIds = (uniqueSongs, existingSongs) => {
  const nonExistentSongIds = [];
  const existingSongIds = existingSongs.map(song => {
    const { _id: songId } = song;
    return String(songId)
  });
  for (let i = 0; i < uniqueSongs.length; i += 1) {
    const id = uniqueSongs[i];
    if (!existingSongIds.includes(id)) {
      nonExistentSongIds.push(id);
    }
  }
  return nonExistentSongIds;
};

const validateSongsExist = async songs => {
  if (!Array.isArray(songs)) {
    const e = new CustomError('"songs" must be an array.', 400);
    return { e };
  }
  const uniqueSongs = Array.from(new Set(songs));
  const existingSongs = await getExistingSongsByIds(uniqueSongs);
  const nonExistentSongs =
    await getNonExistentSongIds(uniqueSongs, existingSongs);
  if (nonExistentSongs.length > 0) {
    const e = new CustomError(
      `"songs": "${nonExistentSongs.join(', ')}" does not exist.`, 400);
    return { e };
  }
  return { uniqueSongs };
}

export default validateSongsExist;

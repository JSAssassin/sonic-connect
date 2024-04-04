import Song from '../models/song-model.js';

const getExistingSongsByIds = async songs => Song.find({
  '_id': { $in: songs }
});

const getNonExistentSongIds = (ids, existingSongs) => {
  const nonExistentSongIDs = [];
  const existingSongIDs = existingSongs.map(song => {
    const { _id: songId } = song;
    return String(songId)
  });
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    if (!existingSongIDs.includes(id)) {
      nonExistentSongIDs.push(id);
    }
  }
  return nonExistentSongIDs;
};

const validateSongsExist = async (songs) => {
  const existingSongs = await getExistingSongsByIds(songs);
  const nonExistentSongs = await getNonExistentSongIds(songs, existingSongs);
  if (nonExistentSongs.length > 0) {
    return { nonExistentSongs };
  }
  return { nonExistentSongs: [] };
}

export default validateSongsExist;

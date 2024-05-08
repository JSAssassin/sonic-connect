import Artist from '../models/artist-model.js';
import CustomError from './custom-error.js';

const getExistingArtistsByIds = async artists => Artist.find({
  '_id': { $in: artists }
});

const getNonExistentArtistIds = (uniqueArtists, existingArtists) => {
  const nonExistentArtistIDs = [];
  const existingArtistIDs = existingArtists.map(artist => {
    const { _id: artistId } = artist;
    return String(artistId)
  });
  for (let i = 0; i < uniqueArtists.length; i += 1) {
    const id = uniqueArtists[i];
    if (!existingArtistIDs.includes(id)) {
      nonExistentArtistIDs.push(id);
    }
  }
  return nonExistentArtistIDs;
};

const validateArtistsExist = async (artists, paramName) => {
  if (!Array.isArray(artists)) {
    const e = new CustomError(`"${paramName}" must be an array.`, 400);
    return { e };
  }
  const uniqueArtists = Array.from(new Set(artists));
  const existingArtists = await getExistingArtistsByIds(uniqueArtists);
  const nonExistentArtists =
    await getNonExistentArtistIds(uniqueArtists, existingArtists);
  if (nonExistentArtists.length > 0) {
    const e = new CustomError(
      `"${paramName}": "${nonExistentArtists.join(', ')}" does not exist.`, 400);
    return { e };
  }
  return { uniqueArtists };
}

export default validateArtistsExist;

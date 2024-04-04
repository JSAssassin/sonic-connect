import Artist from '../models/artist-model.js';

const validateArtistExists = async (id) => !!(await Artist.findById(id));

export default validateArtistExists;

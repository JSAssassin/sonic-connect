import Album from '../models/album-model.js';

const validateAlbumExists = async (id) => !!(await Album.findById(id));

export default validateAlbumExists;

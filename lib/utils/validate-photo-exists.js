import File from '../models/file-model.js';

const validatePhotoExists = async (id) => !!File.findById(id);


export default validatePhotoExists;

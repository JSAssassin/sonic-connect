import File from '../models/file-model.js';

const validateFileExists = async id => !!File.findById(id);

export default validateFileExists;

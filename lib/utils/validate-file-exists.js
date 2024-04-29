import File from '../models/file-model.js';

const validateFileExists = async id => !!(await File.findById(id))

export default validateFileExists;

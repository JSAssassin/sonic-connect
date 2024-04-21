import fs from 'node:fs';
import mime from 'mime';
import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/create-response.js';
import CustomError from '../utils/custom-error.js';
import File from '../models/file-model.js';

// eslint-disable-next-line no-unused-vars
const uploadFile = asyncErrorHandler(async (req, res, next) => {
  const fileInfo = req.files.file;
  const { mimetype, tempFilePath } = fileInfo;
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'audio/mpeg', 'audio/mp3', 'image/gif',
    'image/webp', 'image/svg+xml', 'audio/aac', 'audio/wav'
  ];
  if (!allowedMimeTypes.includes(mimetype)) {
    fs.unlink(tempFilePath, (err) => {
      if (err) {
        console.error('Error deleting temporary file:', err);
      } else {
        console.log('Temporary file deleted successfully');
      }
    });
    const e = new CustomError(
      `File with mimetype "${mimetype}" not allowed.`, 400);
    return next(e);
  }
  const fileStream = fs.createReadStream(tempFilePath);
  fileStream.on('end', () => {
    // Delete the temporary file after the stream ends
    fs.unlink(tempFilePath, (err) => {
      if (err) {
        console.error('Error deleting temporary file:', err);
      } else {
        console.log('Temporary file deleted successfully');
      }
    });
  });
  const file = new File();
  file.contentType = mimetype;
  const ext = mime.getExtension(file.contentType);
  const { _id: id } = file;
  file.filename = `${id}.${ext}`;
  const {
    _id: fileId, chunkSize, uploadDate, filename, contentType
  } = await file.upload(fileStream);
  const fileData = {
    id: fileId,
    chunkSize,
    uploadDate,
    filename,
    contentType
  }
  return createResponse({ data: { file: fileData }, res, statusCode: 201 });
});

const getFile = asyncErrorHandler(async (req, res, next) => {
  const { filename } = req.params;
  const file = await File.findOne({ filename });
  if (!file) {
    const e = new CustomError(`File with name "${filename}" not found.`, 404);
    return next(e);
  }
  res.setHeader('Content-disposition', `attachment; filename=${file.filename}`);
  res.setHeader('Content-type', `${file.contentType}`);
  return file.download(res);
});

const deleteFile = asyncErrorHandler(async (req, res, next) => {
  const { filename } = req.params;
  const deletedFile = await File.findOneAndDelete({ filename });
  if (!deletedFile) {
    const e = new CustomError(`File with name "${filename}" not found.`, 404);
    return next(e);
  }
  return createResponse({ data: { file: null }, res, statusCode: 200 });
});

export {
  deleteFile,
  getFile,
  uploadFile
}

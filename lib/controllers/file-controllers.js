import fs from 'node:fs';
import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/create-response.js';
import File from '../models/file-model.js';

// eslint-disable-next-line no-unused-vars
const uploadFile = asyncErrorHandler(async (req, res, next) => {
  const fileInfo = req.files.file;
  const { tempFilePath } = fileInfo;
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
  file.filename = fileInfo.name;
  const uploadedFile = await file.upload(fileStream);
  return createResponse({ data: { file: uploadedFile }, res, statusCode: 201 });
});

// eslint-disable-next-line no-unused-vars
const downloadFile = asyncErrorHandler(async (req, res, next) => {
  console.log("TODO")
});

// eslint-disable-next-line no-unused-vars
const deleteFile = asyncErrorHandler(async (req, res, next) => {
  console.log("TODO")
});

// eslint-disable-next-line no-unused-vars
const updateFile = asyncErrorHandler(async (req, res, next) => {
  console.log("TODO")
});

export {
  deleteFile,
  downloadFile,
  updateFile,
  uploadFile
}

import { createRequire } from 'module';
import asyncErrorHandler from '../utils/async-error-handler.js';
import createResponse from '../utils/createResponse.js';

const require = createRequire(import.meta.url);

const packagejson = require('../../package.json');

// eslint-disable-next-line no-unused-vars
const ping = asyncErrorHandler(async (req, res, next) => createResponse({
  data: { version: packagejson.version },
  res,
  status: 'ok',
  statusCode: 200
}));

export default ping;

import { createRequire } from 'module';
import asyncErrorHandler from '../utils/async-error-handler.js';

const require = createRequire(import.meta.url);

const packagejson = require('../../package.json');

// eslint-disable-next-line no-unused-vars
const ping = asyncErrorHandler(async (req, res, next) => {
  res.status(200).json({
    status: 'ok',
    version: packagejson.version
  });
});

export default ping;

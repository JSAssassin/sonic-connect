import CustomError from '../utils/custom-error.js';

const devErrors = (res, e) => res.status(e.statusCode).json({
  status: e.status,
  message: e.message,
  stackTrace: e.stack,
  error: e.error
});

const prodErrors = (res, e) => {
  if (e.isOperational) {
    return res.status(e.statusCode).json({
      status: e.status,
      message: e.message
    });
  }
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong. Please try again later.'
  });
}

const validationErrorHandler = (e) => {
  const errMsgs = Object.values(e.error.errors)
    .map(err => err.message)
    .join('& ');
  const message = `Invalid input data: ${errMsgs}`;
  return new CustomError(message, 400);
}

const castErrorHandler = (err) => {
  const msg = `Invalid value ${err.value} for ${err.path}.`;
  return new CustomError(msg, 400);
}

const duplicateKeyErrorHandler = (err) => {
  const { email } = err.keyValue;
  const msg = `There is already a record with the email "${email}". ` +
    `Please use another value.`;
  return new CustomError(msg, 409);
}

const handleExpiredJWT = err => {
  const msg = `JWT has expired at ${err.expiredAt}. Please login again.`;
  return new CustomError(msg, 401);
}

const handleInvalidSignature = () => {
  const msg = 'Invalid token. Please login again.';
  return new CustomError(msg, 401);
}

// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  let e = {
    name: err.name,
    stack: err.stack,
    message: err.message,
    error: err,
    ...err
  };
  e.isOperational = err.isOperational || false;
  e.statusCode = err.statusCode || 500;
  e.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    devErrors(res, e);
  } else if (process.env.NODE_ENV === 'production') {
    if (e.name === 'ValidationError') {
      e = validationErrorHandler(e);
    }
    if (e.code === 11000) {
      e = duplicateKeyErrorHandler(e);
    }
    if (e.name === 'CastError') {
      e = castErrorHandler(e);
    }
    if (e.name === 'TokenExpiredError') {
      e = handleExpiredJWT(e);
    }
    if (e.name === 'JsonWebTokenError') {
      e = handleInvalidSignature();
    }
    prodErrors(res, e);
  }
}

export default globalErrorHandler;

const devErrors = (res, e) => {
  res.status(e.statusCode).json({
    status: e.status,
    message: e.message,
    stackTrace: e.stack
  })
}

const prodErrors = (res, e) => {
  if(e.isOperational) {
    res.status(e.statusCode).json({
      status: e.status,
      message: e.message
    })
  } else {
    res.status(500).json({
      status:'error',
      message: 'Something went wrong. Please try again later.'
    })
  }
}

// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  const e = {
    name: err.name,
    stack: err.stack,
    message: err.message,
  };
  e.isOperational = err.isOperational || false;
  e.statusCode = err.statusCode || 500;
  e.status = err.status || 'error';
  if(process.env.NODE_ENV === 'development') {
    devErrors(res, e);
  } else if(process.env.NODE_ENV === 'production') {
    prodErrors(res, e);
  }
}

export default globalErrorHandler;

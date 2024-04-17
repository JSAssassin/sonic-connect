import signLoginToken from './sign-login-token.js';

const createResponse = ({
  count, data, includeJwt = false, message, res, status = 'success', statusCode
} = {}) => {
  if (includeJwt) {
    const { user } = data;
    const token = signLoginToken(user.id);
    const options = {
      httpOnly: true,
      maxAge: process.env.LOGIN_EXPIRES
    }
    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }
    res.cookie('jwt', token, options);
  }
  const responseData = { status };
  if (data) {
    responseData.data = data;
  }
  if (count) {
    responseData.count = count;
  }
  if (message) {
    responseData.message = message;
  }
  return res.status(statusCode).json(responseData);
}

export default createResponse;

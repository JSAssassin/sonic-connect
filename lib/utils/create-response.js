import signLoginToken from './sign-login-token.js';

const createResponse = ({
  count, data, includeJwt = false, message, res, status = 'success', statusCode
} = {}) => {
  const responseData = { status };
  if (includeJwt) {
    const { user } = data;
    const token = signLoginToken(user.id);
    responseData.jwt = token;
  }
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

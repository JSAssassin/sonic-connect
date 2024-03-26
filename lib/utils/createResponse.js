import signLoginToken from "./sign-login-token.js";

const createResponse = ({user, res, statusCode} = {}) => {
  const { _id: id } = user;
  const token = signLoginToken(id);
  const options = {
    httpOnly: true,
    maxAge: process.env.LOGIN_EXPIRES
  }

  if(process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.cookie('jwt', token, options);

  res.status(statusCode).json({
    status: 'success',
    data: { user }
  });
}

export default createResponse;

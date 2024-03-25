import signLoginToken from "./sign-login-token.js";

const createResponse = ({user, res, statusCode} = {}) => {
  const { _id: id } = user;
  const token = signLoginToken(id);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  });
}

export default createResponse;

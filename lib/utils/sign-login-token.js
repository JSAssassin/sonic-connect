import jwt from 'jsonwebtoken';

const signLoginToken = userId => jwt.sign({
  userId
}, process.env.SECRET_STR, {
  expiresIn: process.env.LOGIN_EXPIRES,
})

export default signLoginToken;

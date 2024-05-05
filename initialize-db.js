import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env' });

const DB_NAME = process.env.NODE_ENV === 'test' ?
  `${process.env.DB_NAME}-test` : process.env.DB_NAME;

const options = {
  dbName: DB_NAME
};

const user = process.env.DB_USER;
const pass = process.env.DB_PASSWORD;

if(user) {
  options.user = user;
}

if(pass) {
  options.pass = pass;
}

const conn = await mongoose.connect(process.env.DB_CONN_STR, options);

export default conn;

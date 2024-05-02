import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env' });

const DB_NAME = process.env.NODE_ENV === 'test' ?
  `${process.env.DB_NAME}-test` : process.env.DB_NAME;

const conn = await mongoose.connect(`${process.env.DB_CONN_STR}`, {
  user: process.env.DB_USER,
  pass: process.env.DB_PASSWORD,
  dbName: DB_NAME
});

export default conn;

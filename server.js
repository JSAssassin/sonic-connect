import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app.js';

dotenv.config({ path: '.env' });

const DB_NAME = process.env.NODE_ENV === 'test' ?
  `${process.env.DB_NAME}-test` : process.env.DB_NAME;

mongoose.connect(`${process.env.DB_CONN_STR}`, {
  user: process.env.DB_USER,
  pass: process.env.DB_PASSWORD,
  dbName: DB_NAME
}).then(() => {
  console.log('DB connection successful.');
});

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server has started on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log({
    error: {
      name: err.name,
      message: err.message
    }
  });
  console.log('Unhandled rejection occured. Shutting down server...');
  server.close(() => {
    process.exit(1);
  })
})

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app.js';

dotenv.config({ path: '.env' });

// eslint-disable-next-line no-unused-vars
mongoose.connect(process.env.DB_CONN_STR).then(conn => {
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

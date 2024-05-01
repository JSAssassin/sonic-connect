import dotenv from 'dotenv';
import app from './app.js';
import './initialize-db.js';

dotenv.config({ path: '.env' });

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

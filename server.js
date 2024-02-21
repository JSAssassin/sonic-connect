import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import routes from './app/routes/index.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
// eslint-disable-next-line no-unused-vars
mongoose.connect(process.env.LOCAL_CONN_STR).then(conn => {
  console.log('DB connection successful.');
}).catch((error)=> {
  console.log('Some error has occured.', error);
});

// Middleware
app.use(express.json());
// Routes
app.use(routes);

app.listen(port, () => {
  console.log(`Server has started on port ${port}`);
});

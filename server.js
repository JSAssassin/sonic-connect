import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app.js';

dotenv.config({path: '.env'});

// eslint-disable-next-line no-unused-vars
mongoose.connect(process.env.LOCAL_CONN_STR).then(conn => {
  console.log('DB connection successful.');
}).catch((error)=> {
  console.log('Some error has occured.', error);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server has started on port ${port}`);
});

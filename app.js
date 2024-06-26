import express from 'express';
import helmet from 'helmet';
import fileUpload from 'express-fileupload';
import {
  albumRouter, artistRouter, authRouter, fileRouter, pingRouter, playlistRouter,
  songRouter, userRouter
} from './lib/routes/index.js';
import CustomError from './lib/utils/custom-error.js';
import globalErrorHandler from './lib/controllers/error-controller.js';

const app = express();

app.use(express.static('./public'));

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload({
  parseNested: true,
  useTempFiles: true
}));

// Routes
app.use('/api/v1/', pingRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/albums', albumRouter);
app.use('/api/v1/artists', artistRouter);
app.use('/api/v1/files', fileRouter);
app.use('/api/v1/playlists', playlistRouter);
app.use('/api/v1/songs', songRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  const e =
    new CustomError(`Cannot find "${req.originalUrl}" on the server.`, 404);
  next(e);
});

app.use(globalErrorHandler);

export default app;

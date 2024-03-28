import mongoose from 'mongoose';

const { Schema } = mongoose;

const songSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Please enter the song title.'],
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'Please enter the song duration in milliseconds.']
  },
  genre: String,
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
  },
  releaseDate: {
    type: Date,
    required: [true, 'Please provide the release date for the song.']
  },
});

const Song = mongoose.model('Song', songSchema);

export default Song;

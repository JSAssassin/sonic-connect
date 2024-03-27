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
    required: true
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
  }
});

const Song = mongoose.model('Song', songSchema);

export default Song;

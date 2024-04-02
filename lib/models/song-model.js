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
  genre: {
    type: [String],
    validate: {
      validator(value) {
        return value && value.length > 0;
      },
      message: 'Please provide at least one genre for the song.'
    }
  },
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
}, {
  timestamps: true
});

const Song = mongoose.model('Song', songSchema);

export default Song;

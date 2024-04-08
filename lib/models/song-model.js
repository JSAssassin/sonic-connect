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
        return Array.isArray(value) &&
          value.length > 0 &&
          value.every(
            genre => typeof genre === 'string' &&
              genre.trim() !== '' &&
              !genre.includes(','));
      },
      message: props => `${props.value} is not a valid genre. Please enter ` +
        `a valid genre.`
    },
    set: value => value ? value.map(genre => genre.toLowerCase()) : value
  },
  artists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  }],
  featuredArtists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist'
  }],
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

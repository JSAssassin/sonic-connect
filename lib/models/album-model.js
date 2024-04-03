import mongoose from 'mongoose';

const { Schema } = mongoose;

const albumSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Please enter the song title.'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a brief description for the album.']
  },
  releaseDate: {
    type: Date,
    required: [true, 'Please provide the release date for the album.']
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
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  }
}, {
  timestamps: true
});

const Album = mongoose.model('Album', albumSchema);

export default Album;

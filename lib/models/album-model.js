import mongoose from 'mongoose';

const { Schema } = mongoose;

const albumSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Please enter the song title.'],
    trim: true
  },
  description: String,
  releaseDate: {
    type: Date,
    required: [true, 'Please provide the release date for the album.']
  },
  genre: {
    type: [String],
    validate: {
      validator(value) {
        return value &&
          Array.isArray(value) &&
          value.length > 0 &&
          value.every(
            genre => typeof genre === 'string' &&
            genre.trim() !== '' &&
            !genre.includes(','));
      },
      message: props => `${props.value} is not a valid genre. Please enter ` +
        `a valid genre.`
    },
    set(value) {
      return value.map(genre => genre.toLowerCase());
    }
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  }
});

const Album = mongoose.model('Album', albumSchema);

export default Album;

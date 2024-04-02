import mongoose from 'mongoose';

const { Schema } = mongoose;

const albumSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Please enter the song title.'],
    trim: true
  },
  description: String,
  duration: {
    type: Number,
    required: true
  },
  releaseDate: {
    type: Date,
    required: true
  },
  genre: {
    type: [String],
    validate: {
      validator(value) {
        return value && value.length > 0;
      },
      message: 'Please provide at least one genre for the album.'
    }
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true
  }]
});

const Album = mongoose.model('Album', albumSchema);

export default Album;

import mongoose from 'mongoose';
import Song from "./song-model.js";

const { Schema } = mongoose;

const artistSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please enter the artist name.'],
    trim: true
  },
  biography: {
    type: String,
    required: [true, 'Please provide a brief description of the artist.'],
  },
  origin: String,
  yearFormed: {
    type: Number,
    required: [true, 'Please provide the year the artist was established.'],
  },
  genre: {
    type: [String],
    validate: {
      validator(value) {
        return value && value.length > 0;
      },
      message: 'Please provide at least one genre for the artist.'
    }
  }
}, {
  timestamps: true
});

async function deleteAllSongsByTheArtist(next) {
  const { _conditions: { _id: artistId } } = this;
  await Song.deleteMany({ artist: artistId });
  return next();
}

artistSchema.pre('findOneAndDelete', deleteAllSongsByTheArtist);

const Artist = mongoose.model('Artist', artistSchema);

export default Artist;

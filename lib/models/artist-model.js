import mongoose from 'mongoose';
import Album from "./album-model.js";
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
  }
}, {
  timestamps: true
});

async function deleteArtistContent(next) {
  const { _conditions: { _id: artistId } } = this;
  await Song.deleteMany({ artist: artistId });
  await Album.deleteMany({ artist: artistId });
  return next();
}

artistSchema.pre('findOneAndDelete', deleteArtistContent);

const Artist = mongoose.model('Artist', artistSchema);

export default Artist;

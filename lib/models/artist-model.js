import mongoose from 'mongoose';
import Album from "./album-model.js";
import File from "./file-model.js";
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
    trim: true,
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
  },
  photo: {
    type: Schema.Types.ObjectId,
    ref: 'File',
    required: true
  }
}, {
  timestamps: true
});

async function deleteArtistContent(next) {
  const { _conditions: { _id: artistId } } = this;
  // delete artist photo
  const artist = await this.model.findById(artistId).populate('photo');
  await File.findOneAndDelete({ filename: artist.photo.filename });
  // delete all albums associated with the artist(featured or main)
  const albums = await Album.find({
    $or: [
      { artists: { $in: [artistId] } },
      { featuredArtists: { $in: [artistId] } }
    ]
  });
  albums.forEach(async album => {
    await File.findOneAndDelete({ _id: album.photo });
  });
  await Album.deleteMany({
    $or: [
      { artists: { $in: [artistId] } },
      { featuredArtists: { $in: [artistId] } }
    ]
  });
  // delete all songs associated with the artist(featured or main)
  const songs = await Song.find({
    $or: [
      { artists: { $in: [artistId] } },
      { featuredArtists: { $in: [artistId] } }
    ]
  });
  songs.forEach(async song => {
    await File.findOneAndDelete({ _id: song.photo });
    await File.findOneAndDelete({ _id: song.audioFile });
  });
  await Song.deleteMany({
    $or: [
      { artists: { $in: [artistId] } },
      { featuredArtists: { $in: [artistId] } }
    ]
  });
  return next();
}

artistSchema.pre('findOneAndDelete', deleteArtistContent);

const Artist = mongoose.model('Artist', artistSchema);

export default Artist;

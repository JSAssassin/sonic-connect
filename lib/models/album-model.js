import mongoose from 'mongoose';
import File from "./file-model.js";
import Song from "./song-model.js";

const { Schema } = mongoose;

const albumSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Please enter the song title.'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
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
  artists: [{
    type: Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  }],
  featuredArtists: [{
    type: Schema.Types.ObjectId,
    ref: 'Artist',
  }],
  photo: {
    type: Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
}, {
  timestamps: true
});

async function deleteAllSongsOfTheAlbum(next) {
  const { _conditions: { _id: albumId } } = this;
  const album = await this.model.findById(albumId);
  // delete album photo
  await File.findOneAndDelete({ filename: album.photo.filename });
  // delete all songs associated with the album
  const songs = await Song.find({ album: albumId });
  songs.forEach(async song => {
    await File.findOneAndDelete({ _id: song.photo });
    await File.findOneAndDelete({ _id: song.audioFile });
  });
  await Song.deleteMany({ album: albumId });
  return next();
}

albumSchema.pre('findOneAndDelete', deleteAllSongsOfTheAlbum);

const Album = mongoose.model('Album', albumSchema);

export default Album;

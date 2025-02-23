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
    set: value => value ? value.map(genre => genre.toLowerCase()) : value,
    required: true
  },
  artists: [{
    type: Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  }],
  photo: {
    type: Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
}, {
  timestamps: true,
  versionKey: false
});

async function deleteAllSongsOfTheAlbum(next) {
  const { _conditions: { _id: albumId } } = this;
  // delete all songs associated with the album
  const songs = await Song.find({ album: albumId });
  songs.forEach(async song => {
    if (song.photo) {
      await File.findByIdAndDelete(song.photo);
    }
    await File.findByIdAndDelete(song.audioFile);
  });
  await Song.deleteMany({ album: albumId });
  const album = await this.model.findById(albumId);
  // delete album photo
  await File.findByIdAndDelete(album.photo);
  return next();
}

albumSchema.pre('findOneAndDelete', deleteAllSongsOfTheAlbum);

const Album = mongoose.model('Album', albumSchema);

export default Album;

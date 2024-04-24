import mongoose from 'mongoose';
import File from "./file-model.js";

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
    type: Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  }],
  featuredArtists: [{
    type: Schema.Types.ObjectId,
    ref: 'Artist'
  }],
  album: {
    type: Schema.Types.ObjectId,
    ref: 'Album',
  },
  releaseDate: {
    type: Date,
    required: [true, 'Please provide the release date for the song.']
  },
  photo: {
    type: Schema.Types.ObjectId,
    ref: 'File'
  },
  audioFile: {
    type: Schema.Types.ObjectId,
    ref: 'File',
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

async function deleteSongContent(next) {
  const { _conditions: { _id: songId } } = this;
  const song = await this.model.findById(songId);
  // delete song photo
  if (song.photo) {
    await File.findByIdAndDelete(song.photo);
  }
  // delete song audio
  await File.findOneAndDelete(song.audioFile);
  return next();
}

songSchema.pre('findOneAndDelete', deleteSongContent);

const Song = mongoose.model('Song', songSchema);

export default Song;

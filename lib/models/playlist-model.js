import mongoose from 'mongoose';

// Define schema for Playlist
const playlistSchema = new mongoose.Schema({
  title: {
    type: String,
    unique: true,
    required: [true, 'Please enter the playlist title.'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: String,
  isPublic: {
    type: Boolean,
    default: true
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }]
}, {
  timestamps: true
});

const Playlist = mongoose.model('Playlist', playlistSchema);

export default Playlist;

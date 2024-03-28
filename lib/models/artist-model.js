import mongoose from 'mongoose';

const { Schema } = mongoose;

const artistSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please enter the artist name.'],
    trim: true
  },
  biography: {
    type: String,
    required: [true, 'Please provide a breif description of the artist.'],
  },
  origin: String,
  yearFormed: {
    type: Number,
    required: [true, 'Please provide the year the artist or band was formed.'],
  },
  genre: String
});

const Artist = mongoose.model('Artist', artistSchema);

export default Artist;

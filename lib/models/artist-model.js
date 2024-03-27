import mongoose from "mongoose";

const { Schema } = mongoose;

const artistSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please enter the song title.'],
    trim: true
  },
  biography: {
    type: String,
    required: true
  },
  origin: String,
  yearFormed: {
    type: Number,
    required: true
  },
  genre: String
});

const Artist = mongoose.model('Artist', artistSchema);

export default Artist;

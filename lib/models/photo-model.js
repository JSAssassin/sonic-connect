import mongoose from 'mongoose';
import gridFileSchema from 'gridfile';

const Photo = mongoose.model('Photo', gridFileSchema)

export default Photo;

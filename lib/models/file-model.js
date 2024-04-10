import mongoose from 'mongoose';
import gridFileSchema from 'gridfile';

const File = mongoose.model('File', gridFileSchema)

export default File;

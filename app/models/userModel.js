import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import validator from 'validator';

const { Schema } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email.'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Username is required.'],
    unique: true,
    trim: true
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Password is required.'],
    minlength: [10, 'Password must have at least 10 charachters'],
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

async function hashPassword(req, _res, next) {
  const user = this;
  if (!user.isModified('password')) return next();
  try {
    user.password = await bcrypt.hash(req.body.password, 10);
    return next();
  } catch (error) {
    return next(error);
  }
}

// Hash the password before saving it to the database
userSchema.pre('save', hashPassword);

// Compare the given password with the hashed password in the database
userSchema.method({
  comparePassword(password) {
    return bcrypt.compare(password, this.password);
  }
})

const User = mongoose.model('User', userSchema);

export default User;

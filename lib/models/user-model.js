import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import validator from 'validator';

const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name.']
  },
  email: {
    type: String,
    required: [true, 'Please enter your email.'],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: props => `${props.value} is not a valid email!`
    },
    trim: true
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please enter your password.'],
    minLength: [10, 'Password must have at least 10 characters'],
    trim: true,
    select: false
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password.'],
    trim: true,
    validate: {
      validator(val) {
        return val === this.password;
      },
      message: 'Password entered does not match.'
    }
  },
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
  passwordChangedAt: Date,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

async function hashPassword(next) {
  const user = this;
  // check if the password has been modified or not
  if (!user.isModified('password')) {
    return next();
  }
  try {
    // encrypt password before saving
    user.password = await bcrypt.hash(user.password, 12);
    user.confirmPassword = undefined;
    return next();
  } catch (e) {
    return next(e);
  }
}

async function comparePassword(password, passwordInDB) {
  return bcrypt.compare(password, passwordInDB);
}

function createPasswordResetToken() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const user = this;
  user.passwordResetToken =
    crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
}

function isPasswordChanged(JWTIssuedTimestamp) {
  const user = this;
  if (user.passwordChangedAt) {
    const passwordChangedAtTimestamp = Date.parse(user.passwordChangedAt) / 1000;
    return passwordChangedAtTimestamp > JWTIssuedTimestamp;
  }
  return false;
}

// Hash the password before saving it to the database
userSchema.pre('save', hashPassword);

// Compare the given password with the hashed password in the database
userSchema.methods.comparePassword = comparePassword;

userSchema.methods.isPasswordChanged = isPasswordChanged;

userSchema.methods.createPasswordResetToken = createPasswordResetToken;

const User = mongoose.model('User', userSchema);

export default User;

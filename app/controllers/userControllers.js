import User from '../models/userModel.js';

const login = async (req, res) => {
  try {
    // get user from database.
    const user = await await User.find({ email: req.body.email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
    }
    const passwordMatch = await user.comparePassword(req.body.password);
    if (!passwordMatch) {
      res.status(401).json({ message: 'Incorrect password' });
    }
    res.status(200).json({ status: 'Login successful.' });
  } catch (e) {
    console.error('Error logging in user:', e);
    res.status(500).json({ message: 'Failed to log in.' });
  }
};

const register = async (req, res) => {
  try {
    const user = {
      created: Date.now(),
      username: req.body.username,
      email: req.body.email
    }
    // store user in database.
    const newUser = new User(user);
    const registeredUser = await newUser.save();
    res.status(201).json({
      status: 'Registration successful.',
      data: { registeredUser }
    });
  } catch (e) {
    console.error('Error registering user:', e);
    res.status(500).json({ message: 'Failed to register user.' });
  }
};

export { login, register }

import express from 'express';
import routes from './app/routes/index.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
// Routes
app.use(routes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const express = require('express');
const app = express();
const sequelize = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, 
}));

require('dotenv').config();

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);



sequelize.sync().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
});


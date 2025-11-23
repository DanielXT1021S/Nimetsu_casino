// src/server.js
'use strict';

require('dotenv').config();
const path       = require('path');
const express    = require('express');
const cors       = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const blackjackRoutes = require('./routes/blackjackRoutes');
const rouletteRoutes = require('./routes/rouletteRoutes');
const slotsRoutes = require('./routes/slotsRoutes');
const pokerRoutes = require('./routes/pokerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const withdrawRoutes = require('./routes/withdrawRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pageRoutes  = require('./routes/pageRoutes');


const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));


app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/game', gameRoutes);
app.use('/api/blackjack', blackjackRoutes);
app.use('/api/roulette', rouletteRoutes);
app.use('/slots', slotsRoutes);
app.use('/poker', pokerRoutes);
app.use('/payment', paymentRoutes);
app.use('/withdraw', withdrawRoutes);
app.use('/admin', adminRoutes);


app.use('/', pageRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor casino escuchando en http://localhost:${PORT}`);
});

const express = require('express'); 
const app = express();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const uuid = require('uuid');
const bodyparser = require('body-parser');

// set the upload limit, in this case I gave it 50 mb
app.use(bodyparser.urlencoded({ limit: '50mb', extended: true }))
app.use(cors()) // we are allowing every sites to send API call
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
// setting the upload folder as static folder


const authRoutes = require('./auth-routes/auth');
const sellerRoutes = require('./seller-routes/seller');
const buyerRoutes = require('./buyer-routes/buyer');
const messagesRoutes = require('./messages-routes/messages');

const Port = 3000;

app.use('/auth', authRoutes);
app.use('/seller', sellerRoutes);
app.use('/buyer', buyerRoutes);
app.use('/messages', messagesRoutes);

app.listen(Port, () => {
    console.log('Server is running on port 3000');
})
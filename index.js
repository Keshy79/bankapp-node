const express = require('express');
require('dotenv').config();
let port = process.env.PORT;
const mongoose = require('mongoose');
const cors = require('cors');
const userRouter = require('./Routes/User.Route');
let URI = process.env. URI
const app = express();

app.use(cors());
app.use(express.json());
app.use('/client', userRouter);

app.listen(port, () => {
    mongoose.connect(URI)
    .then (() => {
        console.log(`Server is running on port ${port} and database connected successfully`);
    })
    .catch((error) => {
        console.log(`Error connecting to the database: ${error.message}`);
    })
})

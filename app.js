const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

const userRoutes = require('./routes/userRoutes');
const AppError = require('./utils/appError');

app.use(cors());
app.use(bodyParser.json());
app.use(function (req, res, next) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true")
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept,Authorization"
    );
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');

    next();
});
//express.static(path.join(__dirname,'./static'))
app.use(['/audio'],(req,res,next)=>{res.set('content-type', 'audio/mp3');res.set('accept-ranges', 'bytes');res.sendFile(path.join(__dirname,`./statics${req.originalUrl}`));});
app.use(['/image'],(req,res,next)=>{res.set('content-type', 'image/png');res.set('accept-ranges', 'bytes');res.sendFile(path.join(__dirname,`./statics${req.originalUrl}`));});
app.use('/videochat/API/v1/users',userRoutes);
app.all('*', (req, res, next) => {
    next(
        new AppError(
            `Can't find ${req.originalUrl} on this server!`,
            404
        )
    )
});
module.exports = app;

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

const userRoutes = require('./routes/userRoutes');
const AppError = require('./utils/appError');

app.use(cors());
app.use(bodyParser.json())
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

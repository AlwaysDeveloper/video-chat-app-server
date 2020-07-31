const User = require('./../models/userModel');
const Room = require('./../models/roomModel');
const Message = require('./../models/messageModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getInfo = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id).select('-__v').populate(['contacts']);
    res.status(200).json({
        status: `success`,
        data: user
    });
});

exports.searchUser =catchAsync(async (req, res, next) =>{
   const expression = req.body.toSeacrh;
   const regExp = new RegExp(expression,'^');
   const result = await User.find({
       $or: [{'name':{$eq: regExp}}, {'email':{$eq: regExp}}]
   });
});

exports.createGroup = catchAsync(async (req, res, next) => {
   const {name, users, chatType} = req.body;
   const group = await Room.create({
      name,
      users,
      chatType
   });
});

exports.processingMessages = catchAsync(async (req, res, next) =>{
    const {_id} = req.user;
    const {limit, id} = req.query;
    const start = Math.ceil(Date.now() / 1000);
    const end = start - 84600;
    await Message.aggregate([
        {$match: {
                $or: [{to:{$all: [id]}}]
        }},
        {$limit: parseInt(limit)}
    ]).exec((error, messages) => {
        console.log(messages);
        User.populate(messages, {path: 'from'}, (err, messages) => {
            res.status(200).json({
                status: 'success',
                _id: _id,
                messages
            })
        })
    });
});

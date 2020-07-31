const mongoose = require('mongoose');

const roomSchema = mongoose.Schema({
   name:{
       type: String,
       required: [true, 'what this group to be called']
   },
    users:{
       type: [{type: mongoose.Schema.Types.ObjectId, ref:'User'}],
        minlength: [2, 'A room must have two people']
    },
    chatType:{
       type: String,
        enum: ['personal','group','webinar'],
        default: 'personal'
    },
    messages:{
        type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Message'}]
    }
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;

const mongooose = require('mongoose');

const messageSchema = mongooose.Schema({
    from:{
        type: mongooose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Where it comes from?']
    },
    to:{
        type: [{type: mongooose.Schema.Types.ObjectId, ref: 'User'}],
        ref: 'User',
        required: [true, 'Where it is going?']
    },
    message:{
        type: String,
        required: [true, 'What is the message again?']
    },
    timestamp: Number,
    file:{
        type: String
    }
});

const Message = mongooose.model('Message', messageSchema);

module.exports = Message;

const mongoose = require('mongoose');
// const dotenv = require('dotenv');

const app = require('./app');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const socketController = require('./controllers/socketController');
const Message = require('./models/messageModel');
const User = require('./models/userModel');

const SocketController = new socketController();

const userSocketMapper= {};
const room = 'test';

io.on('connection', (socket) => {

    socket.on('confirm-connection', (clientID) => {
        userSocketMapper[clientID._id] = socket.id;
        let onlineList = {};
        for(let i=0; i < clientID._contacts.length; i++){
            if(userSocketMapper[clientID._contacts[i]._id]){
                onlineList[clientID._contacts[i]._id] = userSocketMapper[clientID._contacts[i]._id]
            }
        }
        socket.broadcast.emit('user-online', {
           _id: clientID._id,
           _socket: socket.id,
        });

        socket.emit('acknowledged',onlineList);
    });

    socket.on('media-ready', (id) => {
       socket.emit('make-call',{id});
    });

    socket.on('disconnect', () => {
        let disconnected;
        for(const key in userSocketMapper){
            if(userSocketMapper[key] === socket.id){
                disconnected = key;
                delete userSocketMapper[key];
            }
        }
       socket.broadcast.emit('user-gone',{
          _socket:socket.id,
           _contact: disconnected
       });
    });

    socket.on('make-call', data => {
      const {offer , _to} = data;
      socket.to(_to).emit(
          'call-coming',
          {
              offer,
              _from: socket.id
          });
    });

    socket.on('make-call-revers', data => {
        const {offer} = data;
        console.log(data.socket, socket.id)
        socket.to(data.socket).emit(
            'revers-call',
            {
                offer,
                socket: socket.id
            }
        );
    });

    socket.on('answer', data => {
        socket.to(data.to).emit('call-accepted',{
            _from: socket.id,
            answer: data.answer,
        })
    });

    socket.on('answer-revers', data => {
        socket.to(data.socket).emit('accepted-revers',{
            socket: socket.id,
            answer: data.answer,
        })
    })

    socket.on('connect-finalized', data => {
       socket.to(data.to).emit('connect-finalized',{
          _from: socket.id,
          answer: data.answer
       });
    });

    socket.on('init-duplex', data => {
        console.log(data);
        socket.to(data.to).emit('duplex-init', {socket: socket.id});
    });

    socket.on('join-room', data => {
        console.log(`${socket.id} has joined the room: ${data.room}`);
        socket.join(data.room);
        socket.to(data.room).emit('new-joining', {
            room: data.room,
            socket: socket.id
        })
    });

    socket.on('join-acknowledge' , data => {
        socket.to(data.to).emit('start-call',{
            socket: socket.id
        })
    });

    socket.on('please-connect', data => {
       socket.to(data.socket).emit('do-connect', {
          offer: data.offer,
          socket: socket.id
       });
    });

    socket.on('ok-connected', data => {
       socket.to(data.socket).emit('connect-done', {
          answer: data.answer,
          socket: socket.id
       });
    });

    socket.on('make-room-call', data => {
       socket.to(data._to).emit('join-conference', {
          offer: data.offer,
           socket: socket.id,
           room: data.to
       });
    });

    socket.on('conference-answer', data => {
        socket.in(data.room).to(data.socket).emit('answer-from', {
            room: data.room,
            // socket:
        });
    });

    socket.on('leaving-room', data => {
        socket.to(data.room).emit('room-leaved',{
            socket: socket.id
        });
        socket.leave(data.room);
    });

    socket.on('message-to', async data => {
       const message =  await Message.create(data.message);
        socket.to(data._to).emit('message-from',{
            socket: socket.id,
            message,
        });
        socket.emit('message-send', {
            message
        });
    });

    socket.on('do-search', async data => {
        const regex = new RegExp(data.search);
        const user = await User.find({
           $or: [{name: {$regex: regex}}, {email: {$regex: regex}}]
        });
        socket.emit('search-done',{
            result: user
        });
    });
});

// dotenv.config({path: './config.env'});

const {HOST_ADDRESS ,PORT, MONGO_DB} = process.env;
console.log(MONGO_DB);

mongoose.connect(
    MONGO_DB,
    {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: true,
        useUnifiedTopology: true
    },
    (error) => {
        console.log(error)
    }
    ).then(()=>{
   console.log(`Database is connected at ${new Date().toISOString()}`)
});

server.listen(8080,()=>{
    console.log(`Video Chat App server is listening at : ${HOST_ADDRESS}:${PORT}`);
});

module.exports = io;

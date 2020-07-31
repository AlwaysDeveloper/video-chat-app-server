const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

class socketController{
    acknowledged = (contacts) => {
        this.socketUserMap[client._id] = client._socket;
        const toCheck = client._contacts;
        const toInfrom = [];
        for(const client in this.socketUserMap){
            if(toCheck.includes(client)){
                toInfrom.push({
                    _id:client,
                    _socket:this.socketUserMap[client]
                });
            }
        }
        return toInfrom;
    };
}

module.exports = socketController;

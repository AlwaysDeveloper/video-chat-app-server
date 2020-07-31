const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
   name:{
       type: String,
       required: [true, 'Name is required to identify']
   },
    email:{
       type: String,
        required: [true, 'Need your email please!'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'not a valid email']
    },
    password:{
       type: String,
        required: [true,'password require for protection'],
        minlength: 8,
        select: false
    },
    rooms:{
      type: [{type: mongoose.Schema.Types.ObjectId, ref:'Room'}],
        select: false
    },
    contacts:{
      type: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
        select: false
    },
    photo:{
       type: String
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
});

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')){ return next(); }
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.pre('save', function (next) {
    if(!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
})

userSchema.methods.correctPassword = async function (toCheck, password) {
 return await bcrypt.compare(toCheck, password);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );

        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

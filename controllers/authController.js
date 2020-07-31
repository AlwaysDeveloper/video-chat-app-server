const { promisify } = require('util');
const JWT = require('jsonwebtoken');
const {OAuth2Client} = require('google-auth-library');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');

const client = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENTID);
const signToken = id => {
    return JWT.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);

    res.cookie('jwt', token, {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
   const newUser = await User.create({
       name: req.body.name,
       email: req.body.email,
       password: req.body.password,
   });
   createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;

    if(!email||!password){
        return next(
          new AppError(
              'Please provide email and password',
              400
          )
        );
    }

    const user = await User.findOne({email}).select('+password');
    user.rooms = ['test']

    if(!user || !(await user.correctPassword(password, user.password))){
        return next(
            new AppError(
                'Incorrect email or password',
                401
            )
        )
    }

    createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
    console.log(req);
    req.cookie('jwt', 'logout',{
       expires: new Date(Date.now() + 10 * 1000),
       httpOnly: true
    });
    res.status(200).json({status: 'success'});
}

exports.protect = catchAsync(async (req, res, next) => {
   let token;
   if(req.headers.authorization ||req.headers.authorization.startsWith('Bearer')){
       if(req.headers.authorization.includes('G_AUTHUSER_H=0; ')) {
           token = req.headers.authorization.split(' ')[2];
       }else {
           token = req.headers.authorization.split(' ')[1];
       }
   }else if(req.cookie.jwt){
       token = req.cookie.jwt;
   }
   if (!token){
       return next(
           new AppError(
               'You are not logged in!',
               401
           )
       )
   }
   const decoded = await promisify(JWT.verify)(token, process.env.JWT_SECRET);

   const currentUser = await User.findById(decoded.id);
   if(!currentUser){
       return next(
           new AppError(
               'The user belonging to this token is no longer exist on the server.',
               401
           )
       )
   }

   req.user = currentUser;
   req.app.locals.user = currentUser;
   next();
});

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookie.jwt) {
        try {
            const decoded = await promisify(JWT.verify)(
                req.cookie.jwt,
                process.env.JWT_SECRET
            );

            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            res.app.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
}

exports.isLoggedInByHeader = async (req, res, next) => {
    res.status(201).json({
        status: 'success',
        lStatus: true
    })
}

exports.googleLogin = async (req, res, next) =>
{
    const ticket = await client.verifyIdToken({
        idToken: req.body.idToken,
        audience: process.env.GOOGLE_OAUTH_CLIENTID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    const {email, name} = payload;
    let user = await User.findOne({email});
    console.log(user);
    if (!user){
        user = await User.create({
            name,
            email,
            password: userid
        });
    }else if( !user.photo) {
        user.photo = req.body.photoUrl;
        user = await User.findOneAndUpdate(user);
    }

    createSendToken(user, 200, req, res);
}

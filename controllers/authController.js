const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/usersModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');
const {RSA_NO_PADDING} = require('constants');

const createSendToken = (user, statusCode, res) => {
    const token = jwt.sign({
        id: user._id
    }, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});

    const cookieOptions = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        secure: true,
        httpOnly: true,
        sameSite: 'Lax'
    };

    if (process.env.NODE_ENV === 'development') 
        cookieOptions.secure = false;
    
    res.cookie('jwt', token, cookieOptions)

    res
        .status(statusCode)
        .json({
            status: 'success',
            token,
            user: {
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
}

const confirmPassword = (password, passwordConfirm) => {
    if (password !== passwordConfirm) {
        throw new AppError('Password and passwordConfirm do not match', 400);
    }
}

exports.signup = catchAsync(async(req, res, next) => {

    confirmPassword(req.body.password, req.body.passwordConfirm);

    const newUser = await User.create({name: req.body.name, email: req.body.email, password: req.body.password});

    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async(req, res, next) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return next(new AppError('Please enter email and password', 400));
    }

    const user = await User
        .findOne({email})
        .select('+password');

    if (!user || !(await user.checkPassword(password, user.password))) {
        return next(new AppError('Incorrect Email or Password. Please try again', 400));
    }

    createSendToken(user, 200, res);
});

exports.protectRoute = catchAsync(async(req, res, next) => {

    if (req.user) 
        return next();
    
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req
            .headers
            .authorization
            .replace(/Bearer\s/, '');
    }

    if (!token) 
        return next(new AppError('Please login to get access.', 401));
    
    const decodedToken = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const user = await User
        .findById(decodedToken.id)
        .select('+passwordSetAt');

    if (!user) {
        return next(new AppError('The user not longer exists', 401));
    }

    if (user.isPasswordSetAfterToken(decodedToken.iat)) {
        return next(new AppError('Token is no longer valid please login again.', 401));
    }

    req.user = user;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You dont have the permission to perform this action', 403));
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async(req, res, next) => {
    const user = await User.findOne({email: req.body.email});

    if (!user) 
        return next(new AppError('User not found', 404));
    
    const resetToken = user.createAndSetPasswordReset();

    await user.save({validateBeforeSave: false});

    const resetURL = `${req
        .protocol}://${req
        .get('host')}/api/v1/users/reset-password/${resetToken}`;

    const message = `Forgot your password? Submit a patch request with your new password and passwordConfirm to: "${resetURL}" ./n If you didn't request this mail ignore it.`;

    try {
        await sendEmail({email: user.email, subject: 'Your Password Reset Link (valid for 10min)', text: message});
    } catch (err) {
        user.passwordReset = undefined;

        await user.save({validateBeforeSave: false});

        return next(new AppError(`Could not send email, try again later.`, 500));
    }

    res
        .status(200)
        .json({status: 'success', message: 'Reset link sent to email'});

});

exports.resetPassword = catchAsync(async(req, res, next) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        'passwordReset.token': hashedToken,
        'passwordReset.expDate': {
            $gt: Date.now()
        }
    });

    if (!user) 
        return next(new AppError('Invalid Token or expired', 400));
    
    confirmPassword(req.body.password, req.body.passwordConfirm);

    user.password = req.body.password;
    user.passwordReset = undefined;

    await user.save();

    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async(req, res, next) => {

    const {password, newPassword, newPasswordConfirm} = req.body;

    if (!password || !newPassword || !newPasswordConfirm) {
        return next(new AppError('Please provide: current password "password", "newPassword" and "newPasswordConfi' +
                'rm"',
        400));
    }

    confirmPassword(newPassword, newPasswordConfirm);

    const user = await User
        .findById(req.user._id)
        .select('+password');

    if (!(await user.checkPassword(req.body.password, user.password))) {
        return next(new AppError('Incorrect password. Please try again', 401));
    }

    user.password = newPassword;

    await user.save();

    createSendToken(user, 200, res);

});

exports.cookieLogin = catchAsync(async(req, res, next) => {

    if (!req.cookies.jwt || req.headers.loggedin === 'true') 
        return next();
    
    const decodedToken = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

    const user = await User
        .findById(decodedToken.id)
        .select('+passwordSetAt');

    if (!user) {
        return next(new AppError('The user not longer exists', 401));
    }

    if (user.isPasswordSetAfterToken(decodedToken.iat)) {
        return next(new AppError('Token is no longer valid please login again.', 401));
    }

    res.append('user', `${user.name}/${user.email}/${user.role}`);
    res.append('Cache-Control', 'no-cache, no-store, must-revalidate');
    req.user = user;

    next();
});

exports.cookieLogout = (req, res, next) => {
    const cookieOptions = {
        expires: new Date(0),
        secure: true,
        httpOnly: true,
        SameSite: 'Lax'
    };

    res.cookie('jwt', 'hlikub', cookieOptions)

    res
        .status(200)
        .json({status: 'success'});
};

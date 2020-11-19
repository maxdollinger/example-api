/* jshint esversion:10 */
const User = require('../models/usersModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getMe = (req, res, next) => {
     req.params.id = req.user._id;
     next();
}

exports.updateMe = (req, res, next) => {
     if(req.body.password || req.body.passwordConfirm) {
          return next(new AppError('To update password use /update-password', 400));
     }

     const allowedFields = ['name', 'email'];
     Object.keys(req.body).forEach(key => !allowedFields.includes(key) && delete req.body[key] );

     next();
}

exports.setAdmin = (req, res, next) => {
     if(req.user.role === 'admin') req.select = '+isActive +passwordSetAt';
     next();
}

exports.getAllUsers = factory.getAll(User);

exports.getOneUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

exports.deleteMe = catchAsync( async (req, res, next) => {

     await User.findByIdAndUpdate(req.user._id, {isActive: false});

     res.status(204).json({
          status: 'success'
     })
});


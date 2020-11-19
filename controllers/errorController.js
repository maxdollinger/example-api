const AppError = require("../utils/appError");

const sendErrorDev = (err, res) => {
     res.status(err.statusCode).json({
          status: err.status,
          err: err,
          message: err.message,
          err: err.stack,
     });
};

const sendErrorProd = (err, res) => {
     if(err.isOperational) {
          res.status(err.statusCode).json({
               status: err.status,
               message: err.message
          });
     } else {

          res.status(500).json({
               status: 'err',
               message: 'Uuuups something bad happend.'
          });
     }
     
};

const handleCastErrorDB = (err) => {
     return new AppError(err.message, 400);
};

const handleDuplicateFieldsDB = (err) => {
     let message = err.message.replace(/(?:.+{\s)(.+)(?::.+")(.+)(?:".+)/g, (match, p1, p2) => {
          return `Duplicate entry on field: '${p1}' with value: '${p2}'`;
     });
     return new AppError(message, 400);
}

const handleValidationErrorDB = (err) => {
     const errors = Object.values(err.errors).map(el => el.message);
     const message = `Invalid input Data: \n\t ${errors.join('.\n\t ')}`;
     return new AppError(message, 400);
};

const handleJwtError = () => new AppError('Invalid Token please log in again', 401);

module.exports = (err, req, res, next) => {
     err.statusCode = err.statusCode || 500;
     err.status = err.status || 'err';

     if (process.env.NODE_ENV === 'development') {
          sendErrorDev(err, res);
     } else if (process.env.NODE_ENV === 'production') {
          if(err.name === 'CastError') {
              error =  handleCastErrorDB(err);
          }
          if(err.code === 11000) {
               error = handleDuplicateFieldsDB(err);
          }
          if(err.name === 'ValidationError') {
               error =  handleValidationErrorDB(err);
           }
          if(err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
               error = handleJwtError();
          }
          sendErrorProd(error, res);
     }

     next();
};
/* jshint esversion:10 */
const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const globalErrorHandler = require('./controllers/errorController');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const {cookieLogin} = require('./controllers/authController');

const tourRouter = require(`${__dirname}/routes/tourRoutes.js`);
const usersRouter = require(`${__dirname}/routes/usersRoutes.js`);
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
};

app.use(cors({credentials: true, origin: true, exposedHeaders: 'user, Cache-Control'}));
app.use(helmet());

const limiter = rateLimit({max: 100, windowMs: 20 *1000, message: 'To many requests, try again later.'});
app.use('/api/', limiter);

app.use(mongoSanitize());
app.use(xss());
app.use(hpp({whitelist: ['duration']}));
app.use(cookieParser());
app.use(express.static(`${__dirname}/public`));
app.use(express.json({limit: '10kb'}));

//Routers
app.use('/api/v1/*', cookieLogin);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewRouter);

//Respnse for all undefined routes
app.all('*', (req, res, next) => {

    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
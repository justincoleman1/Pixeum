const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const uploadRouter = require('./routes/uploadRoutes');
const userRouter = require('./routes/userRoutes');
const commentRouter = require('./routes/commentRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1) GLOBAL MIDDLEWARES
//Serving static files
app.use(express.static(path.join(__dirname, '/public/')));

const defaultSources = [
  "'self'",
  'data:',
  "'unsafe-eval'",
  "'unsafe-inline'",
  'blob:',
];

const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  "'unsafe-eval'",
  'ajax.googleapis.com',
  'www.google-analytics.com',
  'cdnjs.cloudflare.com',
  'unpkg.com',
];
const styleSources = [
  "'self'",
  "'unsafe-inline'",
  'ajax.googleapis.com',
  'fonts.googleapis.com',
  'cdnjs.cloudflare.com',
];
const connectSources = ["'self'", 'unpkg.com', 'blob:', 'data:'];
const fontSources = ["'self'", 'fonts.gstatic.com'];
const workerSources = ["'self'", 'unsafe-inline', 'blob:'];
const imageSources = ["'self'", 'data:', 'blob:'];
//Set security http headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: defaultSources,
        scriptSrc: scriptSources,
        styleSrc: styleSources,
        connectSrc: connectSources,
        fontSrc: fontSources,
        workerSrc: workerSources,
        imgSrc: imageSources,
      },
    },
    frameguard: {
      action: 'SAMEORIGIN',
    },
    crossOriginEmbedderPolicy: false,
  })
);

//Development logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

//Limit requests from same API
const limiter = rateLimit({
  max: 60,
  windowMS: 60 * 60 * 1000, // 1hour
  message: 'Too many requests for this IP, please try again in an hour!',
});
app.use('/api', limiter);

//Body, parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

//Data sanitization against nosql query injection
app.use(mongoSanitize());

//Data santization against xss
app.use(xss());

//Prevent Parameter Polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

// MOUNTER ROUTER
app.use('/api/v1/uploads', uploadRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/', viewRouter);

//3 ERROR HANDLER
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

const path = require('path'); // built-in Node module for working with file and directory paths
const express = require('express'); // popular Node framework for building web applications
const morgan = require('morgan'); // middleware for logging HTTP requests
const rateLimit = require('express-rate-limit'); // middleware for limiting the number of requests to an API
const helmet = require('helmet'); // middleware for setting HTTP headers to improve security
const mongoSanitize = require('express-mongo-sanitize'); // middleware for preventing MongoDB query injection attacks
const xss = require('xss-clean'); // middleware for preventing cross-site scripting (XSS) attacks
const hpp = require('hpp'); // middleware for preventing HTTP parameter pollution attacks
const cookieParser = require('cookie-parser'); // middleware for parsing cookies from HTTP requests
const session = require('express-session'); // middleware for managing sessions in Express.js
const MongoStore = require('connect-mongo'); // session store for MongoDB
const AppError = require('./utils/appError'); // custom error class for handling errors in the application
const globalErrorHandler = require('./controllers/errorController'); // middleware for handling errors in the application```

const uploadRouter = require('./routes/uploadRoutes');
const userRouter = require('./routes/userRoutes');
const commentRouter = require('./routes/commentRoutes');
const viewRouter = require('./routes/viewRoutes');
const stockRouter = require('./routes/stockRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1) GLOBAL MIDDLEWARES
//Serving static files
app.use(express.static(path.join(__dirname, '/public/')));
app.use('/stock', express.static(path.join(__dirname, 'public/img/stock')));

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
  'code.jquery.com',
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

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DATABASE.replace(
        '<password>',
        process.env.DATABASE_PASSWORD
      ),
    }),
  })
);

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
app.use('/api/v1/stock', stockRouter);
app.use('/', viewRouter);

//3 ERROR HANDLER
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

const path = require('path'); // built-in Node module for working with file and directory paths
const express = require('express'); // popular Node framework for building web applications
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const morgan = require('morgan'); // middleware for logging HTTP requests
const rateLimit = require('express-rate-limit'); // middleware for limiting the number of requests to an API
const helmet = require('helmet'); // middleware for setting HTTP headers to improve security
const mongoSanitize = require('express-mongo-sanitize'); // middleware for preventing MongoDB query injection attacks
const xss = require('xss-clean'); // middleware for preventing cross-site scripting (XSS) attacks
const hpp = require('hpp'); // middleware for preventing HTTP parameter pollution attacks
const cookieParser = require('cookie-parser'); // middleware for parsing cookies from HTTP requests
const AppError = require('./utils/appError'); // custom error class for handling errors in the application
const globalErrorHandler = require('./controllers/errorController'); // middleware for handling errors in the application```

const uploadRouter = require('./routes/uploadRoutes');
const userRouter = require('./routes/userRoutes');
const commentRouter = require('./routes/commentRoutes');
const notificationRouter = require('./routes/notificationRoutes');
const subscriptionRouter = require('./routes/subscriptionRoutes');
const viewRouter = require('./routes/viewRoutes');
const stockRouter = require('./routes/stockRoutes');
const googleAuthRouter = require('./routes/googleAuthRoutes');

const authController = require('./controllers/authController');
// const userController = require('./controllers/userController');

const app = express();

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

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
  'https://accounts.google.com/gsi/',
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
  'https://accounts.google.com/gsi/client',
];
const styleSources = [
  "'self'",
  "'unsafe-inline'",
  'ajax.googleapis.com',
  'fonts.googleapis.com',
  'cdnjs.cloudflare.com',
  'https://accounts.google.com/gsi/style',
];
const connectSources = [
  "'self'",
  'unpkg.com',
  'blob:',
  'data:',
  'https://accounts.google.com/gsi/',
  'https://tenor.googleapis.com',
  'https://media.tenor.com',
];

const frameSources = ["'self'", 'https://accounts.google.com'];
const fontSources = ["'self'", 'fonts.gstatic.com'];
const workerSources = ["'self'", 'unsafe-inline', 'blob:'];
const imageSources = ["'self'", 'data:', 'blob:', 'https://media.tenor.com'];
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
        frameSrc: frameSources,
        scriptSrcAttr: ["'none'"], // Ensure inline script attributes are disabled
      },
    },
    frameguard: {
      action: 'SAMEORIGIN',
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
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

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(authController.deserializeUser);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    authController.googleCallback
  )
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

// Attach user and notifications to res.locals for all routes
// app.use(userController.attachUser);

// MOUNTER ROUTER
app.use('/auth/google', googleAuthRouter);
app.use('/api/v1/uploads', uploadRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);
app.use('/api/v1/:username/:slug/comments', commentRouter);
app.use('/api/v1/stock', stockRouter);
app.use('/', viewRouter);
app.get('/api/tenor', async (req, res) => {
  const { q } = req.query;
  const response = await axios.get(
    `https://tenor.googleapis.com/v2/search?q=${q}&key=${process.env.TENOR_API_KEY}`
  );
  res.json(response.data);
});

//3 ERROR HANDLER
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

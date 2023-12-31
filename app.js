const path = require('path');
const express = require('express');
const morgan = require('morgan'); // gives log in the termianl

// Security stuffs
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');

const cookieParser = require('cookie-parser'); // read cookie
const compression = require('compression'); // compress files for the deployment
const cors = require('cors'); // make api available across other domains

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const viewRouter = require('./routes/viewRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.enable('trust proxy'); // to use with req.headers['x-forwarded-photo'] for Heroku

// For redering
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Implement CORS
// Set req.header; 'Access-Control-Allow-Origin' = '*'  !can be put before a specific route to give access
app.use(cors());
// In case have different domain for frontend and want to give api access, or other some specific webs >> app.use(cors({origin: 'http://www.natours.com'}));

app.options('*', cors()); // allow all routes to perform non simple requests everything other than .get request
// app.options('/api/v1/tours/:id', cors()); // e.g. if want to perform only a specific route

// Serving static files
app.use(express.static(path.join(__dirname, 'public'))); // give access to the local files

// Set security HTTP headers & Fix CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: [
          "'self'",
          'https:',
          'http:',
          'blob:',
          'https://*.mapbox.com',
          'https://js.stripe.com',
          'https://m.stripe.network',
          'https://*.cloudflare.com',
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        workerSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://m.stripe.network',
        ],
        childSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        formAction: ["'self'"],
        connectSrc: [
          "'self'",
          "'unsafe-inline'",
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://127.0.0.1:*/',
        ],
        upgradeInsecureRequests: [],
        // reportTo: ['foo'], // need to configure
        // reportUri: 'https://mydomain.com/report',
      },
      // reportOnly: true,
    },
  }),
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // give log in the termianl like "GET /api/v1/tours?duration=5&diffuculty=easy 200 3978.945 ms - 9387"
}

// Allow 30 requests per IP in 1 hr. To protect brute force
const limiter = rateLimit({
  max: 30,
  windowsMs: 60 * 60 * 1000, // 1 hr. in ms
  message: 'Too many requests for this IP. Please try again in an hour!',
});
app.use('/api', limiter); // if the app restarts, it will count from 0 again

app.post(
  '/webhook-checkout', // route created in Stripe with 'checkout.session.completed'
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout,
);
// need raw data, implement here before body parser(express.json()) convert raw data to json format

// Body parser, reading data from body to req.body
app.use(express.json({ limit: '10kb' })); // middle ware for modifying incoming request data e.g., make req.body
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // get data from a form
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xssClean()); // e.g. name: “<div id=’bad-name’>name</div>

// Prevent HTTP parameter polution
app.use(
  hpp({
    whitelist: [
      // can use double query e.g., '?duration=5&duration=9'
      'duration', // can be more dinamic listing
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use(compression()); // compress all text sent to client

// CSP report
app.use((req, res, next) => {
  res.setHeader(
    'Report-To',
    JSON.stringify({
      group: 'csp-endpoint',
      max_age: 10886400,
      endpoints: [
        { url: `${req.protocol}://${req.get('host')}/__cspreport__` },
      ],
      include_subdomains: true,
    }), // about CSP report, also need to set 'Content-Security-Policy' & route
  );
  res.setHeader(
    'Content-Security-Policy',
    'report-to csp-endpoint; report-uri /__cspreport__;',
  );
  next();
  // res.setHeader(
  //   'Content-Security-Policy',
  //   "default-src 'self' https://*.mapbox.com https://js.stripe.com/v3/;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://js.stripe.com/v3/ https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;report-to csp-endpoint; report-uri /__cspreport__;",
  // );
});

app.post('/__cspreport__', (req, res, next) => {
  console.log(req.body);
}); // report if you forget to allow a legitimate source in production or when an attacker is trying to exploit an XSS attack vector (which you need to identify and stop immediately)

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookie);
  // console.log(req.headers); // to check JWT
  next(); //never forget to call next otherwise the process will stuck
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); // v1 should be an variable, so can easily change app version
// app.use('/api/v1/tours', cors(), tourRouter); // remove app.use and allow only this route
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// If this last middleware is reached, then there is no given route
app.all('*', (req, res, next) => {
  // all('*') catches all req(get post patch delete) and routes('./blah/blahblah')
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
  // whatever is passed in next() = error, and will skip all middlewares jump into error middleware
});

// middleware with 4 variables == error handler recognised by express
app.use(globalErrorHandler);

module.exports = app;

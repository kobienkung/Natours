const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Handle an unhandle synchronous error that occures outside of the express. e.g., undefined parameters
// Located at the top to catch the error
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHTEXCEPTION!💥 Shutting down...');
  console.log(err.name, err.message);
  console.log(err);
  // console.log(err); // optional
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// mongoose.connect is a promise
mongoose
  .connect(DB, {
    // useNewUrlParser: true, // default settings
    // useCreateIndex: true,
    // useFindAndModify: false,
  })
  .then(() => {
    // (con) => {console.log(con.connections)};
    console.log('DB connection successful!');
  });

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(new Date().toISOString());
  console.log(`app running on port ${port}...`);
});

// Handle an unhandle asynchronous error that occures outside of the express. e.g., DB connection with wrong password
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION!💥 Shutting down...');
  console.log(err.name, err.message);
  console.log(err);
  // console.log(err); // optional

  // server.close() allow all pending requests process until the end before closing the server
  server.close(() => {
    process.exit(1); // exit the program
  });
});

// SIGTERM is a ignal from Heroku that will shutdown the server every 24 hrs.
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully...');
  server.close(() => {
    console.log('💥 Process terminated'); // no need for process.exit cuz SIGTERM will exit the program anyway
  });
});

// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 997,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERROR 💥:', err);
//   });

// console.log(app.get('env'));
// console.log(process.env);

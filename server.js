const dotenv = require('dotenv');

dotenv.config({
  path: './config.env'
});

process.on('uncaughtException', (err, origin) => {
  console.log('Uncaught Exception! Shutting down...');
  console.error(err);
  process.exit(1);
});

const app = require('./app.js');

//Database
const mongoose = require('mongoose');
const connectNatoursDB = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.drkwz.mongodb.net/natoursDB?retryWrites=true&
w=majority`;
mongoose
  .connect(connectNatoursDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(con => console.log('DB connection successfull'));


//Start server
const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`server started on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('Unhandled Rejection! Shutting down...');
  console.log(err);
  server.close( () => {
    process.exit(1);
  });
});

//Test
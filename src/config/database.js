const mongoose = require('mongoose');
const { MONGODB_URI, NODE_ENV } = require('./environment');

const connect = async () => {
  const options = {
    autoIndex: NODE_ENV !== 'production',
  };

  await mongoose.connect(MONGODB_URI, options);
};

mongoose.connection.on('disconnected', () => {
  process.stdout.write('MongoDB disconnected\n');
});

mongoose.connection.on('error', (err) => {
  process.stderr.write(`MongoDB error: ${err.message}\n`);
});

module.exports = { connect };

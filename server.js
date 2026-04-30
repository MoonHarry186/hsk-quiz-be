const { connect } = require('./src/config/database');
const { PORT, NODE_ENV } = require('./src/config/environment');
const { runMigrations } = require('./src/services/seedService');
const app = require('./src/app');

const startServer = async () => {
  await connect();
  await runMigrations();

  const server = app.listen(PORT, () => {
    process.stdout.write(`Server running on port ${PORT} in ${NODE_ENV} mode\n`);
  });

  const shutdown = (signal) => {
    process.stdout.write(`${signal} received, shutting down gracefully\n`);
    server.close(() => {
      process.stdout.write('HTTP server closed\n');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    process.stderr.write(`Unhandled rejection: ${err.message}\n`);
    server.close(() => process.exit(1));
  });
};

startServer();

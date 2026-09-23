import mongoose from 'mongoose';
import { config } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDB() {
  mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.info('[db] MongoDB reconnected'));

  await mongoose.connect(config.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: !config.isProd, // auto-build indexes in dev; in production run `npm run seed` / syncIndexes deliberately
  });
  console.info(`[db] Connected to MongoDB (${mongoose.connection.name})`);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

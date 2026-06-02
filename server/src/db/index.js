import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectDb(logger) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  logger?.info({ uri: env.mongoUri }, 'MongoDB connected');
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

import mongoose from 'mongoose';

export async function connectDb(): Promise<typeof mongoose> {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI || MONGO_URI.trim() === '') {
    throw new Error(
      'MONGO_URI environment variable is required but was not provided. Please ensure MONGO_URI is set in your environment or .env file.'
    );
  }

  mongoose.set('strictQuery', false);
  await mongoose.connect(MONGO_URI);
  return mongoose;
}

export default mongoose;

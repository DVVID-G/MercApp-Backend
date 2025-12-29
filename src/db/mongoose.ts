import mongoose from 'mongoose';

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * 
 * Reads `process.env.MONGO_URI` to establish the database connection.
 * Must be called before performing any database operations.
 * 
 * @returns {Promise<typeof mongoose>} The connected mongoose instance.
 * @throws {Error} When MONGO_URI is missing or empty.
 */
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

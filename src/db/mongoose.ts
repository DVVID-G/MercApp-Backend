import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI ;

export async function connectDb(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', false);
  await mongoose.connect(MONGO_URI as string);
  return mongoose;
}

export default mongoose;

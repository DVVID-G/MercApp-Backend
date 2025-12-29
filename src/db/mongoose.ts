import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error(
    'MONGO_URI no está definida. Asegúrate de que el archivo .env existe y contiene MONGO_URI.'
  );
}

export async function connectDb(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', false);
  // TypeScript ya sabe que MONGO_URI es string después de la validación
  await mongoose.connect(MONGO_URI as string);
  return mongoose;
}

export default mongoose;

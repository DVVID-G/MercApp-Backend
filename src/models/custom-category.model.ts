import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomCategory extends Document {
  userId: Types.ObjectId;
  name: string;
  icon?: string;
  color?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomCategorySchema = new Schema<ICustomCategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    icon: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

// Compound index for userId + name (case-insensitive unique per user)
CustomCategorySchema.index(
  { userId: 1, name: 1 },
  {
    unique: true,
    collation: { locale: 'es', strength: 2 }, // Case-insensitive comparison
  }
);

const CustomCategory = model<ICustomCategory>('CustomCategory', CustomCategorySchema);

export default CustomCategory;


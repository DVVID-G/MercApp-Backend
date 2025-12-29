import { Schema, model, Document, Types } from 'mongoose';

export interface IUserPreferences extends Document {
  userId: Types.ObjectId;
  theme: 'light' | 'dark' | 'system';
  language?: string;
  currencyDisplay?: 'COP' | 'USD';
  dateFormat?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    purchaseReminders?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: 'User',
      index: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
      required: true,
    },
    language: {
      type: String,
      trim: true,
    },
    currencyDisplay: {
      type: String,
      enum: ['COP', 'USD'],
    },
    dateFormat: {
      type: String,
      trim: true,
    },
    notifications: {
      email: { type: Boolean },
      push: { type: Boolean },
      purchaseReminders: { type: Boolean },
    },
  },
  { timestamps: true }
);

const UserPreferences = model<IUserPreferences>('UserPreferences', UserPreferencesSchema);

export default UserPreferences;


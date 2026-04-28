import mongoose, { Schema, Document, Types } from 'mongoose';
import { idTransformPlugin } from '../config/mongoosePlugins';

export interface IRestaurant extends Document {
  owner: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  currency: string;
  themeColor: string;
  address?: string;
  phone?: string;
  instagram?: string;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, maxlength: 500 },
    logoUrl: { type: String },
    coverUrl: { type: String },
    currency: { type: String, default: 'USD', uppercase: true, maxlength: 3 },
    themeColor: { type: String, default: '#FF5A1F' },
    address: { type: String, maxlength: 240 },
    phone: { type: String, maxlength: 40 },
    instagram: { type: String, maxlength: 80 },
  },
  { timestamps: true }
);

restaurantSchema.plugin(idTransformPlugin);

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', restaurantSchema);

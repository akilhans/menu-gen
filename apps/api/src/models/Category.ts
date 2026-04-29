import mongoose, { Schema, Document, Types } from 'mongoose';
import { idTransformPlugin } from '../config/mongoosePlugins';

export interface ICategory extends Document {
  restaurant: Types.ObjectId;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ restaurant: 1, sortOrder: 1 });
categorySchema.plugin(idTransformPlugin);

export const Category = mongoose.model<ICategory>('Category', categorySchema);

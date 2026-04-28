import mongoose, { Schema, Document, Types } from 'mongoose';
import { idTransformPlugin } from '../config/mongoosePlugins';

export type ModifierSelectionType = 'single' | 'multiple';

export interface IModifierOption {
  id: string;
  name: string;
  priceDelta: number;
  available: boolean;
}

export interface IModifierGroup {
  id: string;
  name: string;
  selectionType: ModifierSelectionType;
  required: boolean;
  min: number;
  max: number;
  options: IModifierOption[];
}

export interface IMenuItem extends Document {
  restaurant: Types.ObjectId;
  category: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  tags: string[];
  allergens: string[];
  modifierGroups: IModifierGroup[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const modifierOptionSchema = new Schema<IModifierOption>(
  {
    id: { type: String, required: true, trim: true, maxlength: 40 },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    priceDelta: { type: Number, required: true, default: 0 },
    available: { type: Boolean, default: true },
  },
  { _id: false, id: false }
);

const modifierGroupSchema = new Schema<IModifierGroup>(
  {
    id: { type: String, required: true, trim: true, maxlength: 40 },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    selectionType: { type: String, enum: ['single', 'multiple'], default: 'single' },
    required: { type: Boolean, default: false },
    min: { type: Number, default: 0, min: 0, max: 20 },
    max: { type: Number, default: 1, min: 1, max: 20 },
    options: { type: [modifierOptionSchema], default: [] },
  },
  { _id: false, id: false }
);

const menuItemSchema = new Schema<IMenuItem>(
  {
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String },
    available: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    allergens: { type: [String], default: [] },
    modifierGroups: { type: [modifierGroupSchema], default: [] },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurant: 1, category: 1, sortOrder: 1 });
menuItemSchema.plugin(idTransformPlugin);

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', menuItemSchema);

import mongoose, { Schema, Document, Types } from 'mongoose';
import { idTransformPlugin } from '../config/mongoosePlugins';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

export interface ISelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface IOrderItem {
  menuItem: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  selectedModifiers: ISelectedModifier[];
}

export interface IOrder extends Document {
  restaurant: Types.ObjectId;
  table: string;
  items: IOrderItem[];
  subtotal: number;
  status: OrderStatus;
  customerNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const selectedModifierSchema = new Schema<ISelectedModifier>(
  {
    groupId: { type: String, required: true, maxlength: 40 },
    groupName: { type: String, required: true, maxlength: 60 },
    optionId: { type: String, required: true, maxlength: 40 },
    optionName: { type: String, required: true, maxlength: 60 },
    priceDelta: { type: Number, required: true },
  },
  { _id: false, id: false }
);

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true, maxlength: 120 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    notes: { type: String, maxlength: 240 },
    selectedModifiers: { type: [selectedModifierSchema], default: [] },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    table: { type: String, required: true, trim: true, maxlength: 20 },
    items: {
      type: [orderItemSchema],
      validate: [(a: unknown[]) => a.length > 0, 'At least one item is required'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
      index: true,
    },
    customerNote: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.plugin(idTransformPlugin);

export const Order = mongoose.model<IOrder>('Order', orderSchema);

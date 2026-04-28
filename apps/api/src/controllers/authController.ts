import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { signToken } from '../utils/jwt';
import { HttpError } from '../utils/httpError';
import { uniqueSlug } from '../utils/slug';

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  restaurantName: z.string().min(2).max(120),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function toUserDto(u: { _id: unknown; email: string; name: string; createdAt: Date }) {
  return {
    id: String(u._id),
    email: u.email,
    name: u.name,
    createdAt: u.createdAt.toISOString(),
  };
}

export async function register(req: Request, res: Response) {
  const { name, email, password, restaurantName } = req.body as z.infer<typeof registerSchema>;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw HttpError.conflict('Email already in use');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  const slug = await uniqueSlug(restaurantName);
  await Restaurant.create({
    owner: user._id,
    name: restaurantName,
    slug,
    currency: 'USD',
    themeColor: '#FF5A1F',
  });

  const token = signToken({ sub: String(user._id), email: user.email });
  res.status(201).json({ token, user: toUserDto(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as z.infer<typeof loginSchema>;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw HttpError.unauthorized('Invalid credentials');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw HttpError.unauthorized('Invalid credentials');

  const token = signToken({ sub: String(user._id), email: user.email });
  res.json({ token, user: toUserDto(user) });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) throw HttpError.notFound('User not found');
  res.json({ user: toUserDto(user) });
}

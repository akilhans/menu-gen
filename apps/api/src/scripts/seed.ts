import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../config/db';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { Category } from '../models/Category';
import { MenuItem } from '../models/MenuItem';
import { uniqueSlug } from '../utils/slug';

async function run() {
  await connectDb();
  // eslint-disable-next-line no-console
  console.log('[seed] clearing demo data...');
  await Promise.all([
    User.deleteMany({ email: 'demo@menu-gen.app' }),
    Restaurant.deleteMany({ slug: 'copper-kitchen' }),
  ]);

  const passwordHash = await bcrypt.hash('demopass123', 12);
  const user = await User.create({
    name: 'Demo Owner',
    email: 'demo@menu-gen.app',
    passwordHash,
  });

  const slug = await uniqueSlug('Copper Kitchen');
  const restaurant = await Restaurant.create({
    owner: user._id,
    name: 'Copper Kitchen',
    slug,
    description: 'Seasonal plates, small kitchen, big flavor.',
    currency: 'USD',
    themeColor: '#FF5A1F',
    address: '221 Birch Ave, Brooklyn NY',
    phone: '+1 (555) 010-2040',
    instagram: '@copperkitchen',
  });

  const [starters, mains, drinks] = await Promise.all([
    Category.create({ restaurant: restaurant._id, name: 'Starters', sortOrder: 0 }),
    Category.create({ restaurant: restaurant._id, name: 'Mains', sortOrder: 1 }),
    Category.create({ restaurant: restaurant._id, name: 'Drinks', sortOrder: 2 }),
  ]);

  await MenuItem.insertMany([
    {
      restaurant: restaurant._id,
      category: starters._id,
      name: 'Charred Shishito Peppers',
      description: 'Flaked salt, lemon, chili crisp.',
      price: 9,
      tags: ['vegan'],
      sortOrder: 0,
    },
    {
      restaurant: restaurant._id,
      category: starters._id,
      name: 'Burrata Toast',
      description: 'Heirloom tomato, basil oil, sourdough.',
      price: 14,
      tags: ['veg'],
      sortOrder: 1,
    },
    {
      restaurant: restaurant._id,
      category: mains._id,
      name: 'Copper Smash Burger',
      description: 'Double patty, aged cheddar, house sauce, fries.',
      price: 18,
      sortOrder: 0,
    },
    {
      restaurant: restaurant._id,
      category: mains._id,
      name: 'Miso Glazed Salmon',
      description: 'Jasmine rice, charred broccolini, sesame.',
      price: 24,
      sortOrder: 1,
    },
    {
      restaurant: restaurant._id,
      category: drinks._id,
      name: 'Yuzu Spritz',
      description: 'Yuzu, elderflower, soda.',
      price: 11,
      tags: ['cocktail'],
      sortOrder: 0,
    },
    {
      restaurant: restaurant._id,
      category: drinks._id,
      name: 'Cold Brew',
      description: 'Single-origin, 18h steep.',
      price: 5,
      sortOrder: 1,
    },
  ]);

  // eslint-disable-next-line no-console
  console.log('[seed] done.');
  // eslint-disable-next-line no-console
  console.log('     login: demo@menu-gen.app / demopass123');
  // eslint-disable-next-line no-console
  console.log(`     menu : /menu/${restaurant.slug}`);
  await disconnectDb();
}

run().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  await disconnectDb();
  process.exit(1);
});

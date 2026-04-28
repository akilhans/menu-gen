import { connectDb, disconnectDb } from '../config/db';
import { Restaurant } from '../models/Restaurant';
import { Category } from '../models/Category';
import { MenuItem } from '../models/MenuItem';

const SLUG = process.env.SEED_SLUG ?? 'nur-burger';

const PROFILE = {
  name: 'Nur Burger',
  description:
    "Toshkent markazidagi zamonaviy burger kafe. Yangi mahsulotlardan tayyorlangan mol go'shti burgerlari, lavashlar, achchiq garnirlar va uy sharoitidagi shirinliklar. Tez xizmat, samimiy muhit.",
  address: "Amir Temur ko'chasi 12, Toshkent",
  phone: '+998 90 123 45 67',
  instagram: '@nurburger_uz',
  currency: 'UZS',
  themeColor: '#D7341A',
  logoUrl:
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=400&q=80',
  coverUrl:
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1600&q=80',
};

const CATEGORIES = [
  { name: 'Burgerlar', sortOrder: 0 },
  { name: 'Lavash', sortOrder: 1 },
  { name: 'Garnirlar', sortOrder: 2 },
  { name: 'Ichimliklar', sortOrder: 3 },
  { name: 'Desertlar', sortOrder: 4 },
];

type NewItem = {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  tags?: string[];
  allergens?: string[];
};

const ITEMS: Record<string, NewItem[]> = {
  Burgerlar: [
    {
      name: 'Nur Burger',
      description:
        "Nur'ning signatura burgeri: ikki qat mol go'shti, cheddar pishlog'i, karamelizatsiya piyoz va maxsus Nur sousi.",
      price: 55000,
      imageUrl:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      tags: ['signatura', 'mashhur'],
      allergens: ['glyuten', 'sut'],
    },
    {
      name: 'Cheese Burger',
      description:
        "Klassik chizburger: mol go'shti kotleti, cheddar pishlog'i, marinadli bodring va yangi salat.",
      price: 42000,
      imageUrl:
        'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
      tags: ['klassik'],
      allergens: ['glyuten', 'sut'],
    },
    {
      name: 'Double Cheese Burger',
      description:
        "Ikki qat mol go'shti, ikki qat cheddar pishlog'i — chinakam go'sht muxlislari uchun.",
      price: 65000,
      imageUrl:
        'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80',
      tags: ['katta portsiya'],
      allergens: ['glyuten', 'sut'],
    },
    {
      name: 'Chicken Burger',
      description:
        "Marinadlangan tovuq filesi, yangi salat, pomidor va sarimsoqli mayonez.",
      price: 38000,
      imageUrl:
        'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80',
      tags: ['tovuq'],
      allergens: ['glyuten', 'tuxum'],
    },
    {
      name: 'BBQ Burger',
      description:
        "Dudli BBQ sousi, qirg'ich bekon, karamelizatsiya piyoz va cheddar pishloq.",
      price: 58000,
      imageUrl:
        'https://images.unsplash.com/photo-1551615593-ef5fe247e8f7?auto=format&fit=crop&w=800&q=80',
      tags: ['bbq'],
      allergens: ['glyuten', 'sut'],
    },
    {
      name: 'Spicy Chili Burger',
      description:
        "Achchiq chili sousi, jalapenio, pepper-jack pishloq — achchiqlikni sevuvchilar uchun.",
      price: 52000,
      imageUrl:
        'https://images.unsplash.com/photo-1551782450-17144efb9c50?auto=format&fit=crop&w=800&q=80',
      tags: ['achchiq'],
      allergens: ['glyuten', 'sut'],
    },
    {
      name: 'Veggie Burger',
      description: "Sabzavotli kotlet, avokado, pomidor, yangi salat — go'shtsiz.",
      price: 35000,
      imageUrl:
        'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80',
      tags: ['vegan'],
      allergens: ['glyuten'],
    },
  ],
  Lavash: [
    {
      name: "Mol go'shti lavash",
      description:
        "Marinadlangan mol go'shti, yangi sabzavotlar, sarimsoq-smetanali sous, issiq yupqa lavash.",
      price: 38000,
      imageUrl:
        'https://images.unsplash.com/photo-1565299585323-38174c3c0acf?auto=format&fit=crop&w=800&q=80',
      allergens: ['glyuten', 'sut'],
    },
    {
      name: 'Tovuq lavash',
      description:
        "Marinadlangan tovuq go'shti, sabzavotlar, sarimsoqli sous.",
      price: 32000,
      imageUrl:
        'https://images.unsplash.com/photo-1633321702518-7feccafb94d5?auto=format&fit=crop&w=800&q=80',
      tags: ['tovuq'],
      allergens: ['glyuten'],
    },
    {
      name: 'Aralash doner',
      description:
        "An'anaviy doner: mol va tovuq aralashmasi, kombinatsiyali sous.",
      price: 40000,
      imageUrl:
        'https://images.unsplash.com/photo-1530469912745-a215c6b256ea?auto=format&fit=crop&w=800&q=80',
      allergens: ['glyuten'],
    },
    {
      name: 'Shashlik lavash',
      description:
        "Olovda pishirilgan shashlik go'shti, sumak, qizil piyoz va tandir non.",
      price: 45000,
      imageUrl:
        'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80',
      tags: ['mashhur'],
      allergens: ['glyuten'],
    },
  ],
  Garnirlar: [
    {
      name: 'Kartoshka fri',
      description: "Qarsildoq oltin-sariq kartoshka, dengiz tuzi.",
      price: 18000,
      imageUrl:
        'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
      tags: ['vegan'],
    },
    {
      name: 'Truffle fri',
      description: "Trufel yog'i, parmezan qirindisi, bahorli ko'kat.",
      price: 28000,
      imageUrl:
        'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=800&q=80',
      tags: ['premium'],
      allergens: ['sut'],
    },
    {
      name: 'Onion rings',
      description: "Qarsildoq piyoz halqalari, buttermilk sousi bilan.",
      price: 22000,
      imageUrl:
        'https://images.unsplash.com/photo-1639667851574-8a11a81b44e1?auto=format&fit=crop&w=800&q=80',
      allergens: ['glyuten'],
    },
    {
      name: 'Tovuq nagget (6 dona)',
      description: "Qarsildoq tovuq naggetlari, barbekyu yoki sarimsoq sous.",
      price: 25000,
      imageUrl:
        'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=800&q=80',
      allergens: ['glyuten'],
    },
    {
      name: 'Mozzarella sticks',
      description: "Erigan mozzarella, qarsildoq qoplama, marinara sousi.",
      price: 28000,
      imageUrl:
        'https://images.unsplash.com/photo-1531749668029-257aeef6c8fd?auto=format&fit=crop&w=800&q=80',
      tags: ['veg'],
      allergens: ['glyuten', 'sut'],
    },
  ],
  Ichimliklar: [
    {
      name: 'Coca-Cola 0.5L',
      price: 12000,
      imageUrl:
        'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Fanta 0.5L',
      price: 12000,
      imageUrl:
        'https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Sprite 0.5L',
      price: 12000,
      imageUrl:
        'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Uy limonadi',
      description: "Yangi limon, yalpiz va asal.",
      price: 15000,
      imageUrl:
        'https://images.unsplash.com/photo-1523371054106-bbf80586c33c?auto=format&fit=crop&w=800&q=80',
      tags: ['uy', 'yangi'],
    },
    {
      name: 'Kofe latte',
      description: "Dada kofe, baxmal sut ko'pigi.",
      price: 18000,
      imageUrl:
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
      allergens: ['sut'],
    },
    {
      name: 'Apelsin soki',
      description: "Apelsindan siqilgan yangi sok.",
      price: 15000,
      imageUrl:
        'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
      tags: ['yangi', 'vegan'],
    },
  ],
  Desertlar: [
    {
      name: 'Vanilli muzqaymoq',
      description: "Uy sharoitida tayyorlangan vanilli muzqaymoq, qaymoq bilan.",
      price: 15000,
      imageUrl:
        'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
      tags: ['klassik'],
      allergens: ['sut'],
    },
    {
      name: 'Shokoladli tort',
      description:
        "Qalin qatlamli, shokoladli ganache bilan — chinakam shokolad muxlislari uchun.",
      price: 25000,
      imageUrl:
        'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80',
      tags: ['shokolad'],
      allergens: ['glyuten', 'sut', 'tuxum'],
    },
    {
      name: 'Olmali pirog',
      description: "Uy sharoitidagi olma pirogi, darchin va karamel bilan.",
      price: 22000,
      imageUrl:
        'https://images.unsplash.com/photo-1621743478914-cc8a86d7e7b5?auto=format&fit=crop&w=800&q=80',
      allergens: ['glyuten', 'sut', 'tuxum'],
    },
    {
      name: 'New York cheesecake',
      description: "Klassik N'yu York cheesecake, olma qaymog'i bilan.",
      price: 28000,
      imageUrl:
        'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
      tags: ['mashhur'],
      allergens: ['glyuten', 'sut', 'tuxum'],
    },
  ],
};

async function run() {
  await connectDb();

  const restaurant = await Restaurant.findOne({ slug: SLUG });
  if (!restaurant) {
    // eslint-disable-next-line no-console
    console.error(
      `[seed] Restaurant "${SLUG}" not found. Create it in the dashboard first.`
    );
    await disconnectDb();
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`[seed] Found: ${restaurant.name} (${restaurant.slug})`);

  Object.assign(restaurant, PROFILE);
  await restaurant.save();
  // eslint-disable-next-line no-console
  console.log('[seed] Profile updated.');

  await Promise.all([
    Category.deleteMany({ restaurant: restaurant._id }),
    MenuItem.deleteMany({ restaurant: restaurant._id }),
  ]);
  // eslint-disable-next-line no-console
  console.log('[seed] Old menu cleared.');

  const categoryIds: Record<string, unknown> = {};
  for (const cat of CATEGORIES) {
    const created = await Category.create({
      restaurant: restaurant._id,
      name: cat.name,
      sortOrder: cat.sortOrder,
    });
    categoryIds[cat.name] = created._id;
  }

  let total = 0;
  for (const [catName, items] of Object.entries(ITEMS)) {
    const categoryId = categoryIds[catName];
    if (!categoryId) continue;
    const docs = items.map((item, idx) => ({
      restaurant: restaurant._id,
      category: categoryId,
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      tags: item.tags ?? [],
      allergens: item.allergens ?? [],
      available: true,
      sortOrder: idx,
    }));
    await MenuItem.insertMany(docs);
    total += docs.length;
  }

  // eslint-disable-next-line no-console
  console.log(`[seed] Created ${CATEGORIES.length} categories, ${total} items.`);
  // eslint-disable-next-line no-console
  console.log(`[seed] Done. Visit /menu/${SLUG}`);

  await disconnectDb();
}

run().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  await disconnectDb();
  process.exit(1);
});

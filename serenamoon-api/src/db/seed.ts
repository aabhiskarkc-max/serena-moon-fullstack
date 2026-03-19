import 'dotenv/config';
import { hash } from 'bcrypt';
import { eq, inArray } from 'drizzle-orm';
import { db } from './drizzle';
import { users, plans, posts } from './schema';

const DEMO_USER_EMAIL = 'demo@serena.local';
const DEMO_USER_PASSWORD = 'demo1234';

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  console.log('Seeding database...');

  // 1. Demo user (for posts author)
  const hashedPassword = await hash(DEMO_USER_PASSWORD, 10);
  const existingUser = await db.select().from(users).where(eq(users.email, DEMO_USER_EMAIL)).limit(1);

  let demoUserId: string;
  if (existingUser.length > 0) {
    demoUserId = existingUser[0].id;
    console.log('Demo user already exists:', DEMO_USER_EMAIL);
  } else {
    const [inserted] = await db
      .insert(users)
      .values({
        email: DEMO_USER_EMAIL,
        username: 'demoadmin',
        password: hashedPassword,
        role: 'admin',
      })
      .returning({ id: users.id });
    if (!inserted) throw new Error('Failed to create demo user');
    demoUserId = inserted.id;
    console.log('Created demo user:', DEMO_USER_EMAIL, '(password: ' + DEMO_USER_PASSWORD + ')');
  }

  // 2. Plans — remove existing demo plans by name so re-run is idempotent
  const demoPlanNames = ['Starter', 'Patron', 'Collector'];
  await db.delete(plans).where(inArray(plans.name, demoPlanNames));

  const demoPlans = [
    {
      name: 'Starter',
      description: 'Perfect for casual followers. Monthly access to standard content and early previews.',
      priceMonthly: 9,
      priceYearly: 89,
      allowPremium: false,
    },
    {
      name: 'Patron',
      description: 'Full access to the digital vault, high-resolution essays, and exclusive behind-the-scenes.',
      priceMonthly: 19,
      priceYearly: 179,
      allowPremium: true,
    },
    {
      name: 'Collector',
      description: 'Everything in Patron plus limited prints, direct feedback on work, and priority support.',
      priceMonthly: 49,
      priceYearly: 449,
      allowPremium: true,
    },
  ];

  await db.insert(plans).values(demoPlans);
  console.log('Seeded', demoPlans.length, 'plans');

  // 3. Posts — remove existing demo posts (by this user) so re-run is idempotent
  await db.delete(posts).where(eq(posts.userId, demoUserId));

  const demoPosts = [
    {
      userId: demoUserId,
      caption: 'The Golden Hour: Morning light on the shore.',
      description: 'A short visual essay on stillness and the first hour of daylight by the water. There is a specific quality to the light at 6:00 AM that feels like a secret between the sun and the tide.',
      type: 'image' as const,
      visibility: 'free' as const,
      thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    },
    {
      userId: demoUserId,
      caption: 'Behind the Lens: The making of the "Tides" series.',
      description: 'A deep dive into the technical and emotional process of capturing the ocean in motion. In this video, I break down the shutter speeds used to achieve that ethereal, milky texture. Exclusive for my dedicated supporters.',
      type: 'video' as const,
      visibility: 'subscriber' as const,
      thumbnail: 'https://images.unsplash.com/photo-1492691523567-6170f0295dbd?auto=format&fit=crop&w=800&q=80',
    },
    {
      userId: demoUserId,
      caption: 'Fragments of the Week — A New Reel.',
      description: 'A collection of quick cuts, transient moments, and sensory details from the last seven days. It’s less about a story and more about a feeling. Best experienced with the sound turned up.',
      type: 'reel' as const,
      visibility: 'free' as const,
      thumbnail: 'https://images.unsplash.com/photo-1551392505-f4056bb330f0?auto=format&fit=crop&w=800&q=80',
    },
    {
      userId: demoUserId,
      caption: 'Premium Exclusive: The Unreleased Stills.',
      description: 'One of the frames that never made the final edit of the gallery exhibition. I’ve always had a soft spot for this shot’s imperfect symmetry, but it felt too personal for the public eye until now.',
      type: 'image' as const,
      visibility: 'premium' as const,
      thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    },
    {
      userId: demoUserId,
      caption: 'On Patience, Composition, and the Art of Waiting.',
      description: 'A written reflection on the virtue of waiting for the right moment in landscape photography. Sometimes the best shot isn’t the one you planned, but the one that happens ten minutes after you thought about packing up.',
      type: 'text' as const,
      visibility: 'free' as const,
      thumbnail: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=800&q=80',
    },
  ];
  for (const post of demoPosts) {
    await db.insert(posts).values(post);
  }
  console.log('Seeded', demoPosts.length, 'posts');

  console.log('Seed completed.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

// Seed tools table from original Sanity data
// Run with: DATABASE_URL="your-neon-url" node scripts/seed-tools.js

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  console.error('Run as: DATABASE_URL="postgresql://..." node scripts/seed-tools.js');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Original resources from Sanity — URLs recovered from Sanity CDN
// Website Link items with no URL are included so you can add URLs later via Admin
const tools = [
  {
    title: 'Action-Oriented-Leader',
    category: 'Tools',
    description: null,
    type: 'file',
    file_url: 'https://cdn.sanity.io/files/9ksnhows/production/a46c72afa031c44734cd95c6bfbc5cf4d4d2d079.pdf',
    external_url: null,
    is_hidden: false,
    sort_order: 1,
  },
  {
    title: 'Connection-Oriented-Leader',
    category: 'Tools',
    description: null,
    type: 'file',
    file_url: 'https://cdn.sanity.io/files/9ksnhows/production/b920079b1565efbbdbac39a03f3eb23a09bc1a3f.pdf',
    external_url: null,
    is_hidden: false,
    sort_order: 2,
  },
  {
    title: 'Thinking-Oriented-Leader',
    category: 'Tools',
    description: null,
    type: 'file',
    file_url: 'https://cdn.sanity.io/files/9ksnhows/production/52b3d26693dd83d03f3836444f74940773a5339c.pdf',
    external_url: null,
    is_hidden: false,
    sort_order: 3,
  },
  {
    title: 'Values Assessment',
    category: 'Leadership',
    description: 'This is an exercise to help you discover your top values. Awareness is critical in bringing a sense of alignment in your life.',
    type: 'file',
    file_url: 'https://cdn.sanity.io/files/9ksnhows/production/5fe80e1f7d90302ef747043bf737a34f1c119ea4.pdf',
    external_url: null,
    is_hidden: false,
    sort_order: 10,
  },
  {
    title: 'Burnout',
    category: 'Leadership',
    description: 'What is your burnout trying to tell you? There is something going on and it may not be as obvious at first glance. By looking a little deeper, you will find the core.',
    type: 'link',
    file_url: null,
    external_url: null, // ← add URL via Admin
    is_hidden: false,
    sort_order: 11,
  },
  {
    title: '5 Pillars of Health',
    category: 'Leadership',
    description: 'The 5 pillars of wellness form an interconnected system for holistic health. Nurturing all five creates balance, allowing for improved stress management, enhanced relationships, and purposeful living.',
    type: 'link',
    file_url: null,
    external_url: null, // ← add URL via Admin
    is_hidden: false,
    sort_order: 12,
  },
  {
    title: 'Enneagram Assessment',
    category: 'Enneagram',
    description: 'Just send me a message and I can setup your Enneagram Assessment with iEQ9 using my Integrative Enneagram Coach\'s account. Here is some more info about the assessment.',
    type: 'link',
    file_url: null,
    external_url: null, // ← add URL via Admin
    is_hidden: false,
    sort_order: 20,
  },
  {
    title: 'Thanks for the Feedback',
    category: 'Books',
    description: 'Thanks for the Feedback: The Science and Art of Receiving Feedback Well by Douglas Stone and Sheila Heen.',
    type: 'link',
    file_url: null,
    external_url: null, // ← add URL via Admin
    is_hidden: false,
    sort_order: 30,
  },
  {
    title: 'Radical Candor',
    category: 'Books',
    description: null,
    type: 'link',
    file_url: null,
    external_url: null, // ← add URL via Admin
    is_hidden: false,
    sort_order: 31,
  },
  {
    title: 'The Coaching Habit',
    category: 'Books',
    description: null,
    type: 'link',
    file_url: null,
    external_url: null, // ← add URL via Admin
    is_hidden: false,
    sort_order: 32,
  },
  {
    title: 'Dare to Lead',
    category: 'Books',
    description: 'Dare to Lead: Brave Work. Tough Conversations. Whole Hearts by Brené Brown.',
    type: 'link',
    file_url: null,
    external_url: null, // ← add URL via Admin
    is_hidden: false,
    sort_order: 33,
  },
  {
    title: 'The Power of TED',
    category: 'Books',
    description: 'The Power of TED by David Emerald.',
    type: 'link',
    file_url: null,
    external_url: null, // ← add URL via Admin
    is_hidden: false,
    sort_order: 34,
  },
];

async function seed() {
  console.log('Seeding tools table...\n');

  // Clear existing tools first to avoid duplicates
  await sql`DELETE FROM tools`;
  console.log('✓ Cleared existing tools');

  let inserted = 0;
  for (const tool of tools) {
    try {
      await sql`
        INSERT INTO tools (title, category, description, type, file_url, external_url, is_hidden, sort_order)
        VALUES (
          ${tool.title},
          ${tool.category},
          ${tool.description},
          ${tool.type},
          ${tool.file_url},
          ${tool.external_url},
          ${tool.is_hidden},
          ${tool.sort_order}
        )
      `;
      console.log(`  ✓ ${tool.title} (${tool.category})`);
      inserted++;
    } catch (err) {
      console.error(`  ✗ Failed to insert "${tool.title}":`, err.message);
    }
  }

  console.log(`\nDone — ${inserted}/${tools.length} tools inserted.`);
  console.log('\nNote: Items with no external_url will not display on the site until');
  console.log('you add a URL for them via the Admin panel → Tools & Resources.');
}

seed().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

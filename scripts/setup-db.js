import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function setup() {
  console.log('Setting up database tables...\n');

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        quote TEXT NOT NULL,
        author VARCHAR(255) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✓ testimonials table ready');
  } catch (err) {
    console.error('✗ Failed to create testimonials table:', err.message);
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        post_date TIMESTAMPTZ,
        author VARCHAR(255) DEFAULT 'John Paine',
        image_url TEXT,
        summary TEXT,
        body TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✓ posts table ready');
  } catch (err) {
    console.error('✗ Failed to create posts table:', err.message);
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS tools (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        description TEXT,
        type VARCHAR(50),
        file_url TEXT,
        external_url TEXT,
        image_url TEXT,
        is_hidden BOOLEAN DEFAULT FALSE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✓ tools table ready');
  } catch (err) {
    console.error('✗ Failed to create tools table:', err.message);
  }

  // Add image_url to tools if it doesn't exist yet (safe to run on existing installs)
  try {
    await sql`ALTER TABLE tools ADD COLUMN IF NOT EXISTS image_url TEXT`;
    console.log('✓ tools.image_url column ensured');
  } catch (err) {
    console.error('✗ Failed to create tools table:', err.message);
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS navigation (
        id SERIAL PRIMARY KEY,
        brand_name VARCHAR(255),
        nav_links JSONB DEFAULT '[]',
        cta_button JSONB DEFAULT '{}'
      )
    `;
    console.log('✓ navigation table ready');
  } catch (err) {
    console.error('✗ Failed to create navigation table:', err.message);
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS bookmark_categories (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✓ bookmark_categories table ready');
  } catch (err) {
    console.error('✗ Failed to create bookmark_categories table:', err.message);
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        url TEXT NOT NULL,
        category_id INTEGER REFERENCES bookmark_categories(id) ON DELETE SET NULL,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✓ bookmarks table ready');
  } catch (err) {
    console.error('✗ Failed to create bookmarks table:', err.message);
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        interest VARCHAR(255),
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        submitted_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✓ contact_submissions table ready');
  } catch (err) {
    console.error('✗ Failed to create contact_submissions table:', err.message);
  }

  // Add contact_submissions if it doesn't exist yet on existing installs
  try {
    await sql`ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`;
    console.log('✓ contact_submissions.is_read column ensured');
  } catch (err) {
    // Table may not exist yet — safe to ignore
  }

  // Insert default navigation row if empty
  try {
    await sql`
      INSERT INTO navigation (brand_name, nav_links, cta_button)
      SELECT 'Your Journey Coach',
        '[{"label":"About","url":"index.html#welcome","visible":true},{"label":"Enneagram","url":"enneagram.html","visible":true},{"label":"Blog","url":"blog.html","visible":true},{"label":"Resources","url":"tools.html","visible":true}]'::jsonb,
        '{"label":"Let''s Talk","url":"index.html#contact","visible":true}'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM navigation)
    `;
    console.log('✓ Default navigation row ensured');
  } catch (err) {
    console.error('✗ Failed to insert default navigation:', err.message);
  }

  // ── site_settings ──────────────────────────────────────────────────────────
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✓ site_settings table ready');
  } catch (err) {
    console.error('✗ Failed to create site_settings table:', err.message);
  }

  const defaults = [
    ['color_accent',       '#c7a96b'],
    ['color_green',        '#4a6741'],
    ['color_bg',           '#fdfbf7'],
    ['color_text',         '#1c2321'],
    ['font_heading',       'Playfair Display'],
    ['font_body',          'Inter'],
    ['cta_primary_text',   "Let's Talk"],
    ['cta_primary_url',    '/#contact'],
    ['cta_secondary_text', ''],
    ['cta_secondary_url',  ''],
    ['site_tagline',       'Executive Coaching · Enneagram · Leadership'],
  ];
  for (const [key, value] of defaults) {
    try {
      await sql`
        INSERT INTO site_settings (setting_key, setting_value)
        VALUES (${key}, ${value})
        ON CONFLICT (setting_key) DO NOTHING
      `;
    } catch (err) {
      console.error(`✗ Failed to seed setting ${key}:`, err.message);
    }
  }
  console.log('✓ Default site settings seeded');

  // ── page_sections ───────────────────────────────────────────────────────────
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS page_sections (
        id SERIAL PRIMARY KEY,
        page VARCHAR(100) NOT NULL,
        section_key VARCHAR(100) NOT NULL,
        label VARCHAR(255) NOT NULL,
        is_visible BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'published',
        content JSONB DEFAULT '{}',
        admin_notes TEXT,
        UNIQUE(page, section_key)
      )
    `;
    console.log('✓ page_sections table ready');
  } catch (err) {
    console.error('✗ Failed to create page_sections table:', err.message);
  }

  const sections = [
    ['home', 'hero',         'Hero Banner',           0],
    ['home', 'about',        'About / Welcome',       1],
    ['home', 'methodology',  'Coaching Methodology',  2],
    ['home', 'testimonials', 'Client Testimonials',   3],
    ['home', 'contact',      'Contact Form',          4],
    ['enneagram', 'hero',       'Hero Banner',        0],
    ['enneagram', 'overview',   'What is Enneagram',  1],
    ['enneagram', 'types',      'The 9 Types',        2],
    ['enneagram', 'assessment', 'Take Assessment',    3],
    ['enneagram', 'cta',        'Call to Action',     4],
    ['blog', 'hero',  'Blog Header',       0],
    ['blog', 'posts', 'Post Listing',      1],
    ['tools', 'hero', 'Resources Header',  0],
    ['tools', 'grid', 'Resources Grid',    1],
  ];
  for (const [page, key, label, order] of sections) {
    try {
      await sql`
        INSERT INTO page_sections (page, section_key, label, sort_order)
        VALUES (${page}, ${key}, ${label}, ${order})
        ON CONFLICT (page, section_key) DO NOTHING
      `;
    } catch (err) {
      console.error(`✗ Failed to seed section ${page}/${key}:`, err.message);
    }
  }
  console.log('✓ Default page sections seeded');

  console.log('\nDatabase setup complete.');
}

setup().catch(err => {
  console.error('Fatal error during setup:', err);
  process.exit(1);
});

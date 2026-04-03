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

  console.log('\nDatabase setup complete.');
}

setup().catch(err => {
  console.error('Fatal error during setup:', err);
  process.exit(1);
});

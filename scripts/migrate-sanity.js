import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const SANITY_BASE = 'https://9ksnhows.api.sanity.io/v2024-03-10/data/query/production';

async function sanityFetch(query) {
  const url = `${SANITY_BASE}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity API error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.result;
}

// Convert Sanity Portable Text blocks to HTML
function portableTextToHtml(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';

  const output = [];
  let listType = null;
  let listItems = [];

  function flushList() {
    if (listItems.length === 0) return;
    const tag = listType === 'number' ? 'ol' : 'ul';
    output.push(`<${tag}>${listItems.join('')}</${tag}>`);
    listItems = [];
    listType = null;
  }

  function renderSpans(block) {
    if (!block.children) return '';
    // Build mark definitions map
    const markDefs = {};
    if (block.markDefs) {
      for (const def of block.markDefs) {
        markDefs[def._key] = def;
      }
    }

    return block.children.map(span => {
      if (!span.text) return '';
      let text = span.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      if (!span.marks || span.marks.length === 0) return text;

      // Apply marks
      for (const mark of span.marks) {
        if (mark === 'strong') text = `<strong>${text}</strong>`;
        else if (mark === 'em') text = `<em>${text}</em>`;
        else if (mark === 'underline') text = `<u>${text}</u>`;
        else if (mark === 'code') text = `<code>${text}</code>`;
        else if (markDefs[mark] && markDefs[mark]._type === 'link') {
          const href = markDefs[mark].href || '';
          text = `<a href="${href}" target="_blank">${text}</a>`;
        }
      }
      return text;
    }).join('');
  }

  for (const block of blocks) {
    if (!block) continue;

    // Handle image blocks
    if (block._type === 'image') {
      flushList();
      const imgUrl = block.asset?.url || (block.asset?._ref
        ? `https://cdn.sanity.io/images/9ksnhows/production/${block.asset._ref.replace('image-', '').replace(/-([a-z]+)$/, '.$1')}`
        : '');
      const alt = block.alt || block.caption || '';
      output.push(`<img src="${imgUrl}" alt="${alt}" />`);
      continue;
    }

    // Only process block types from here
    if (block._type !== 'block') continue;

    const style = block.style || 'normal';
    const listItem = block.listItem;

    if (listItem) {
      const currentListType = listItem === 'number' ? 'number' : 'bullet';
      if (listType && listType !== currentListType) {
        flushList();
      }
      listType = currentListType;
      listItems.push(`<li>${renderSpans(block)}</li>`);
      continue;
    }

    flushList();

    const text = renderSpans(block);

    if (style === 'h2') output.push(`<h2>${text}</h2>`);
    else if (style === 'h3') output.push(`<h3>${text}</h3>`);
    else if (style === 'h4') output.push(`<h4>${text}</h4>`);
    else if (style === 'blockquote') output.push(`<blockquote>${text}</blockquote>`);
    else output.push(`<p>${text}</p>`);
  }

  flushList();
  return output.join('\n');
}

async function migrateTestimonials() {
  console.log('\n--- Migrating Testimonials ---');
  try {
    const records = await sanityFetch('*[_type == "testimonial"]');
    if (!records || records.length === 0) {
      console.log('No testimonials found, skipping.');
      return;
    }
    console.log(`Found ${records.length} testimonials`);
    for (const r of records) {
      await sql`
        INSERT INTO testimonials (quote, author)
        VALUES (${r.quote || ''}, ${r.author || ''})
      `;
    }
    console.log(`Inserted ${records.length} testimonials`);
  } catch (err) {
    console.error('Error migrating testimonials:', err.message);
  }
}

async function migratePosts() {
  console.log('\n--- Migrating Posts ---');
  try {
    const records = await sanityFetch(
      '*[_type == "post"]{_id, title, date, author, "imageUrl": image.asset->url, summary, body}'
    );
    if (!records || records.length === 0) {
      console.log('No posts found, skipping.');
      return;
    }
    console.log(`Found ${records.length} posts`);
    for (const r of records) {
      const bodyHtml = portableTextToHtml(r.body);
      const postDate = r.date ? new Date(r.date) : null;
      await sql`
        INSERT INTO posts (title, post_date, author, image_url, summary, body)
        VALUES (
          ${r.title || ''},
          ${postDate},
          ${r.author || 'John Paine'},
          ${r.imageUrl || null},
          ${r.summary || null},
          ${bodyHtml}
        )
      `;
    }
    console.log(`Inserted ${records.length} posts`);
  } catch (err) {
    console.error('Error migrating posts:', err.message);
  }
}

async function migrateTools() {
  console.log('\n--- Migrating Tools ---');
  try {
    const records = await sanityFetch(
      '*[_type == "tool"]{_id, title, category, description, type, "fileUrl": file.asset->url, external_url, isHidden}'
    );
    if (!records || records.length === 0) {
      console.log('No tools found, skipping.');
      return;
    }
    console.log(`Found ${records.length} tools`);
    for (const r of records) {
      await sql`
        INSERT INTO tools (title, category, description, type, file_url, external_url, is_hidden)
        VALUES (
          ${r.title || ''},
          ${r.category || 'General'},
          ${r.description || null},
          ${r.type || null},
          ${r.fileUrl || null},
          ${r.external_url || null},
          ${r.isHidden || false}
        )
      `;
    }
    console.log(`Inserted ${records.length} tools`);
  } catch (err) {
    console.error('Error migrating tools:', err.message);
  }
}

async function migrateNavigation() {
  console.log('\n--- Migrating Navigation ---');
  try {
    const record = await sanityFetch(
      '*[_type == "navigation"][0]{brand_name, nav_links, cta_button}'
    );
    if (!record) {
      console.log('No navigation found, skipping.');
      return;
    }
    const navLinks = JSON.stringify(record.nav_links || []);
    const ctaButton = JSON.stringify(record.cta_button || {});
    // Update existing navigation row if it exists, otherwise insert
    const existing = await sql`SELECT id FROM navigation LIMIT 1`;
    if (existing.length > 0) {
      await sql`
        UPDATE navigation SET
          brand_name = ${record.brand_name || 'Your Journey Coach'},
          nav_links = ${navLinks}::jsonb,
          cta_button = ${ctaButton}::jsonb
        WHERE id = ${existing[0].id}
      `;
      console.log('Updated navigation row');
    } else {
      await sql`
        INSERT INTO navigation (brand_name, nav_links, cta_button)
        VALUES (
          ${record.brand_name || 'Your Journey Coach'},
          ${navLinks}::jsonb,
          ${ctaButton}::jsonb
        )
      `;
      console.log('Inserted navigation row');
    }
  } catch (err) {
    console.error('Error migrating navigation:', err.message);
  }
}

async function migrateBookmarks() {
  console.log('\n--- Migrating Bookmark Categories ---');
  const categoryIdMap = {}; // sanity _id -> neon id

  try {
    const categories = await sanityFetch(
      '*[_type == "bookmarkCategory"]{_id, title}'
    );
    if (!categories || categories.length === 0) {
      console.log('No bookmark categories found, skipping.');
    } else {
      console.log(`Found ${categories.length} categories`);
      for (const cat of categories) {
        const result = await sql`
          INSERT INTO bookmark_categories (title)
          VALUES (${cat.title || ''})
          RETURNING id
        `;
        categoryIdMap[cat._id] = result[0].id;
      }
      console.log(`Inserted ${categories.length} bookmark categories`);
    }
  } catch (err) {
    console.error('Error migrating bookmark categories:', err.message);
  }

  console.log('\n--- Migrating Bookmarks ---');
  try {
    const bookmarks = await sanityFetch(
      '*[_type == "bookmark"]{_id, title, url, "categoryId": category->_id, description}'
    );
    if (!bookmarks || bookmarks.length === 0) {
      console.log('No bookmarks found, skipping.');
      return;
    }
    console.log(`Found ${bookmarks.length} bookmarks`);
    for (const b of bookmarks) {
      const neonCategoryId = b.categoryId ? (categoryIdMap[b.categoryId] || null) : null;
      await sql`
        INSERT INTO bookmarks (title, url, category_id, description)
        VALUES (
          ${b.title || ''},
          ${b.url || ''},
          ${neonCategoryId},
          ${b.description || null}
        )
      `;
    }
    console.log(`Inserted ${bookmarks.length} bookmarks`);
  } catch (err) {
    console.error('Error migrating bookmarks:', err.message);
  }
}

async function main() {
  console.log('Starting Sanity → Neon migration...');
  await migrateTestimonials();
  await migratePosts();
  await migrateTools();
  await migrateNavigation();
  await migrateBookmarks();
  console.log('\nMigration complete.');
}

main().catch(err => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});

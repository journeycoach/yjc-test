import { sql } from '../_db.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rows = await sql`
      SELECT b.id, b.title, b.url, b.description, b.sort_order,
        bc.id as category_id, bc.title as category_title
      FROM bookmarks b
      LEFT JOIN bookmark_categories bc ON b.category_id = bc.id
      ORDER BY bc.sort_order ASC, b.sort_order ASC
    `;
    return res.status(200).json({ data: rows });
  } catch (err) {
    console.error('bookmarks GET error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
}

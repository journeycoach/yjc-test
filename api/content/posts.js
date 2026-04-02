import { sql } from '../_db.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rows = await sql`
      SELECT id, title, post_date as date, author, image_url, summary, body
      FROM posts
      ORDER BY post_date DESC
    `;
    return res.status(200).json({ data: rows });
  } catch (err) {
    console.error('posts GET error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
}

import { sql } from '../_db.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rows = await sql`SELECT * FROM navigation LIMIT 1`;
    return res.status(200).json({ data: rows[0] || null });
  } catch (err) {
    console.error('navigation GET error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
}

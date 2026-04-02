import { sql } from '../_db.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rows = await sql`
      SELECT id, title, category, description, type,
        file_url as "fileUrl",
        external_url,
        is_hidden as "isHidden"
      FROM tools
      ORDER BY sort_order ASC, created_at ASC
    `;
    return res.status(200).json({ data: rows });
  } catch (err) {
    console.error('tools GET error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
}

const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    const data = await sql`SELECT * FROM drunk_log ORDER BY drunk_at DESC`;
    return res.json(data);
  }
  if (req.method === 'POST') {
    const { name, colour, year, winery, country, region,
            grape, occasion, drunk_at, rating, tasting_note } = req.body;
    const data = await sql`
      INSERT INTO drunk_log (name, colour, year, winery, country, region, grape, occasion, drunk_at, rating, tasting_note)
      VALUES (${name}, ${colour}, ${year||null}, ${winery}, ${country}, ${region},
              ${grape}, ${occasion}, ${drunk_at}, ${rating||null}, ${tasting_note||null})
      RETURNING *`;
    return res.json(data[0]);
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    await sql`DELETE FROM drunk_log WHERE id=${id}`;
    return res.json({ ok: true });
  }
}
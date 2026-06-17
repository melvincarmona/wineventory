const { neon } = require('@neondatabase/serverless');
const { requireAuth } = require('./_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!requireAuth(req, res)) return;
  const sql = neon(process.env.DATABASE_URL);
  const { wine, logData } = req.body;

  // Fetch the authoritative amount from the DB rather than trusting the client-supplied value.
  const [current] = await sql`SELECT amount FROM wines WHERE id=${wine.id}`;
  if (!current) return res.status(404).json({ error: 'Wine not found' });

  await sql`
    INSERT INTO drunk_log (name, colour, year, winery, country, region, grape, occasion, drunk_at, rating, tasting_note)
    VALUES (${wine.name}, ${wine.colour}, ${wine.year||null}, ${wine.winery}, ${wine.country},
            ${wine.region}, ${wine.grape}, ${wine.occasion},
            ${new Date().toISOString().slice(0,10)},
            ${logData.rating ? Number(logData.rating) : null},
            ${logData.tasting_note || null})`;

  const newAmount = current.amount - 1;
  if (newAmount <= 0) {
    await sql`DELETE FROM wines WHERE id=${wine.id}`;
  } else {
    await sql`UPDATE wines SET amount=${newAmount} WHERE id=${wine.id}`;
  }
  res.json({ ok: true });
}

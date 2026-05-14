import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await sql`SELECT * FROM wines ORDER BY name`;
    return res.json(data);
  }
  if (req.method === 'POST') {
    const { name, colour, year, winery, country, region, grape,
            amount, bestBetween, occasion, rationale } = req.body;
    const data = await sql`
      INSERT INTO wines (name, colour, year, winery, country, region, grape, amount, "bestBetween", occasion, rationale)
      VALUES (${name}, ${colour}, ${year||null}, ${winery}, ${country}, ${region}, ${grape},
              ${amount}, ${bestBetween}, ${occasion}, ${rationale})
      RETURNING *`;
    return res.json(data[0]);
  }
  if (req.method === 'PUT') {
    const { id, name, colour, year, winery, country, region, grape,
            amount, bestBetween, occasion, rationale } = req.body;
    const data = await sql`
      UPDATE wines SET name=${name}, colour=${colour}, year=${year||null},
        winery=${winery}, country=${country}, region=${region}, grape=${grape},
        amount=${amount}, "bestBetween"=${bestBetween}, occasion=${occasion}, rationale=${rationale}
      WHERE id=${id} RETURNING *`;
    return res.json(data[0]);
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    await sql`DELETE FROM wines WHERE id=${id}`;
    return res.json({ ok: true });
  }
}
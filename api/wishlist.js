import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await sql`SELECT * FROM wishlist ORDER BY name`;
    return res.json(data);
  }
  if (req.method === 'POST') {
    const { name, colour, year, winery, country, region,
            grape, price, priority, tastingNotes, notes } = req.body;
    const data = await sql`
      INSERT INTO wishlist (name, colour, year, winery, country, region, grape, price, priority, "tastingNotes", notes)
      VALUES (${name}, ${colour}, ${year||null}, ${winery}, ${country}, ${region},
              ${grape}, ${price}, ${priority}, ${tastingNotes}, ${notes})
      RETURNING *`;
    return res.json(data[0]);
  }
  if (req.method === 'PUT') {
    const { id, name, colour, year, winery, country, region,
            grape, price, priority, tastingNotes, notes } = req.body;
    const data = await sql`
      UPDATE wishlist SET name=${name}, colour=${colour}, year=${year||null},
        winery=${winery}, country=${country}, region=${region}, grape=${grape},
        price=${price}, priority=${priority}, "tastingNotes"=${tastingNotes}, notes=${notes}
      WHERE id=${id} RETURNING *`;
    return res.json(data[0]);
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    await sql`DELETE FROM wishlist WHERE id=${id}`;
    return res.json({ ok: true });
  }
}
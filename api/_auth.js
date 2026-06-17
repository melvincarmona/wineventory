const SECRET = process.env.API_SECRET;

function requireAuth(req, res) {
  if (!SECRET) return true; // API_SECRET not configured: unprotected dev/open mode
  const provided = req.headers['x-api-key'];
  if (provided !== SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = { requireAuth };

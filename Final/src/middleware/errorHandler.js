export function notFound(req, res) {
  res.status(404).json({ error: 'Not Found' });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  res.status(500).json({ error: 'Internal Server Error' });
}

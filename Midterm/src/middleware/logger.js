export function logger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const elapsedMs = Date.now() - start;
    console.log(
      `${req.requestId} ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs}ms`
    );
  });

  next();
}

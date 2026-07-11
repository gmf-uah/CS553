export function logger(req, res, next) { // This solution is from the 04-middleware example in the labs repo
    const start = Date.now(); // record the time as soon as the request comes in

    res.on("finish", () => {
        // completes after the response has finished
        const elapsedMs = Date.now() - start;
        console.log(
            `${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs}ms`
        );
    });

    next();
}
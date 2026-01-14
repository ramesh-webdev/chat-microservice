
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token' });
    const token = auth.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // payload typically contains { id: ... }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

export function verifyJwtOptional(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return next();
    const token = auth.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
    } catch (err) {
        // ignore
    }
    next();
}

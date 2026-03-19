import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

/**
 * Middleware to authorize users based on roles.
 * @param {Array} roles - Allowed roles for the route.
 */
export const authorize = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded; // Should contain { id, role }

            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ error: `Access denied. Role ${decoded.role} is not authorized.` });
            }

            next();
        } catch (err) {
            res.status(401).json({ error: 'Invalid or expired token.' });
        }
    };
};

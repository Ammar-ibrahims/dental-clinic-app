/**
 * Input validation middleware factory.
 * Pass an array of { field, message } objects to validate required fields.
 */
export function validateRequired(fields) {
    return (req, res, next) => {
        const errors = [];
        for (const { field, message } of fields) {
            if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
                errors.push(message || `${field} is required`);
            }
        }
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }
        next();
    };
}

/**
 * Validate that :id param is a positive integer.
 */
export function validateIdParam(req, res, next) {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid ID parameter — must be a positive integer' });
    }
    next();
}

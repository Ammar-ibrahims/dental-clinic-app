const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Service to interact with Upstash Redis using the REST API.
 */
export const setCache = async (key, value, expirySeconds = 3600) => {
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return null;

    try {
        const response = await fetch(`${UPSTASH_REDIS_REST_URL}/set/${key}?EX=${expirySeconds}`, {
            headers: {
                Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(value)
        });
        return await response.json();
    } catch (err) {
        console.error('❌ Upstash Cache Set Error:', err.message);
        return null;
    }
};

export const getCache = async (key) => {
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return null;

    try {
        const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
            headers: {
                Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`
            }
        });
        const data = await response.json();
        // Upstash REST returns { result: "..." } where result is the JSON string
        if (data && data.result) {
            return JSON.parse(data.result);
        }
        return null;
    } catch (err) {
        console.error('❌ Upstash Cache Get Error:', err.message);
        return null;
    }
};

export const delCache = async (key) => {
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return null;

    try {
        const response = await fetch(`${UPSTASH_REDIS_REST_URL}/del/${key}`, {
            headers: {
                Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`
            },
            method: 'POST'
        });
        return await response.json();
    } catch (err) {
        console.error('❌ Upstash Cache Delete Error:', err.message);
        return null;
    }
};

export const incr = async (key) => {
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return null;
    try {
        const response = await fetch(`${UPSTASH_REDIS_REST_URL}/incr/${key}`, {
            headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
            method: 'POST'
        });
        const data = await response.json();
        return data.result;
    } catch (err) {
        console.error('❌ Upstash Incr Error:', err.message);
        return null;
    }
};

export const expire = async (key, seconds) => {
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return null;
    try {
        await fetch(`${UPSTASH_REDIS_REST_URL}/expire/${key}/${seconds}`, {
            headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
            method: 'POST'
        });
    } catch (err) {
        console.error('❌ Upstash Expire Error:', err.message);
    }
};

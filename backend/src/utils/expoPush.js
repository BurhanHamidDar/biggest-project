const https = require('https');

const EXPO_API_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send Push Notifications to multiple tokens (Automatic Chunking)
 * @param {string[]} tokens - Array of Expo Push Tokens
 * @param {string} title 
 * @param {string} body 
 * @param {object} data - Optional JSON data
 */
exports.sendPushList = async (tokens, title, body, data = {}) => {
    if (!tokens || tokens.length === 0) return;

    // Filter valid tokens
    const validTokens = tokens.filter(t => t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken'));
    if (validTokens.length === 0) return;

    // Chunking (Expo limit: 100 per request)
    const CHUNK_SIZE = 100;
    const chunks = [];
    for (let i = 0; i < validTokens.length; i += CHUNK_SIZE) {
        chunks.push(validTokens.slice(i, i + CHUNK_SIZE));
    }

    const messages = chunks.map(chunk => ({
        to: chunk,
        sound: 'default',
        title,
        body,
        data,
    }));

    // Send requests in parallel or sequence? Parallel is faster.
    const promises = messages.map(msg => sendToExpo(msg));

    try {
        await Promise.all(promises);
        console.log(`Sent notifications to ${validTokens.length} devices.`);
    } catch (error) {
        console.error('Expo Push Error:', error);
    }
};

/**
 * Send Single Push Notification
 */
exports.sendPush = async (token, title, body, data = {}) => {
    if (!token || (!token.startsWith('ExponentPushToken') && !token.startsWith('ExpoPushToken'))) return;

    const message = {
        to: token,
        sound: 'default',
        title,
        body,
        data,
    };

    try {
        await sendToExpo(message);
    } catch (error) {
        console.error('Expo Push Single Error:', error);
    }
};

// Internal Helper using HTTPS
function sendToExpo(message) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(message);

        const options = {
            hostname: 'exp.host',
            path: '/--/api/v2/push/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Length': data.length,
            },
        };

        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => { responseBody += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(responseBody));
                } else {
                    reject(new Error(`Expo API Status ${res.statusCode}: ${responseBody}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(data);
        req.end();
    });
}

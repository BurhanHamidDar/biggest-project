const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo();

/**
 * Send Push Notifications to multiple tokens
 * @param {string[]} tokens - Array of Expo Push Tokens
 * @param {string} title 
 * @param {string} body 
 * @param {object} data - Optional JSON data
 */
exports.sendPushList = async (tokens, title, body, data = {}) => {
    if (!tokens || tokens.length === 0) return;

    // Filter valid tokens
    const validTokens = tokens.filter(t => Expo.isExpoPushToken(t));
    if (validTokens.length === 0) return;

    // Construct messages
    const messages = [];
    for (let pushToken of validTokens) {
        messages.push({
            to: pushToken,
            sound: 'default',
            title: title,
            body: body,
            data: data,
        });
    }

    // Batch messages (Expo handles chunking internally, but SDK helper is good)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (let chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);

            // Log errors from Expo (e.g. DeviceNotRegistered)
            ticketChunk.forEach((ticket) => {
                if (ticket.status === 'error') {
                    console.error('Expo Push Ticket Error:', ticket.message, ticket.details);
                }
            });

        } catch (error) {
            console.error('Expo Push Error (Chunk):', error);
        }
    }

    // Optional: Handle receipts logic here if needed (omitted for simplicity)
    console.log(`Attempted to send ${messages.length} notifications. Processed ${tickets.length} tickets.`);
};

/**
 * Send Single Push Notification
 */
exports.sendPush = async (token, title, body, data = {}) => {
    if (!token || !Expo.isExpoPushToken(token)) return;
    await exports.sendPushList([token], title, body, data);
};

const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const User = require('../models/User');

let firebaseInitialized = false;

// Attempt to initialize Firebase Admin SDK
try {
  // Check for firebase service account configuration in env or file
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountEnv) {
    const serviceAccount = JSON.parse(serviceAccountEnv);
    initializeApp({
      credential: cert(serviceAccount)
    });
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully via environment credentials.');
  } else {
    // Look for firebase-service-account.json in root or config dir
    const fs = require('fs');
    const path = require('path');
    const saPath = path.join(__dirname, '..', 'firebase-service-account.json');
    
    if (fs.existsSync(saPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('Firebase Admin SDK initialized successfully via local service account file.');
    } else {
      console.warn('Firebase Service Account credentials not found. Push notifications will run in MOCK mode (logging to console).');
    }
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  console.warn('Push notifications will run in MOCK mode.');
}

/**
 * Sends a push notification to specific users
 * @param {Array|String} userIds - A single user ID or array of user IDs
 * @param {String} title - Notification title
 * @param {String} body - Notification body
 * @param {Object} data - Custom payload (optional)
 */
const sendPushNotification = async (userIds, title, body, data = {}) => {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  
  // Format data payload values to strings as required by FCM
  const formattedData = {};
  Object.keys(data).forEach(key => {
    formattedData[key] = String(data[key]);
  });

  try {
    // Find all users and collect their tokens
    const users = await User.find({ _id: { $in: ids } }).select('fcmTokens name email role');
    const tokens = [];
    
    users.forEach(user => {
      if (user.fcmTokens && user.fcmTokens.length > 0) {
        tokens.push(...user.fcmTokens);
      }
    });

    console.log(`[Push Notification Triggered]`);
    console.log(`- Target User IDs: ${ids.join(', ')}`);
    console.log(`- Target Users Found: ${users.map(u => `${u.name} (${u.role})`).join(', ')}`);
    console.log(`- Title: "${title}"`);
    console.log(`- Body: "${body}"`);
    console.log(`- Data:`, formattedData);
    console.log(`- Device Tokens: ${tokens.length} active token(s)`);

    if (tokens.length === 0) {
      console.log('-> Fired mock notification: No active device tokens registered for target user(s).');
      return;
    }

    if (!firebaseInitialized) {
      console.log('-> Fired mock notification (Firebase not initialized).');
      return;
    }

    // Send notifications to all active tokens
    const message = {
      notification: { title, body },
      data: formattedData,
      android: {
        priority: 'high'
      },
      apns: {
        headers: {
          'apns-priority': '10'
        }
      },
      tokens: tokens
    };

    // getMessaging() sends message to list of tokens
    const response = await getMessaging().sendEachForMulticast(message);
    console.log(`-> Push notification successfully dispatched: ${response.successCount} sent, ${response.failureCount} failed.`);
    
    // Cleanup invalid tokens if any failures
    if (response.failureCount > 0) {
      const tokensToRemove = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            tokensToRemove.push(tokens[idx]);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        console.log(`--> Cleaning up ${tokensToRemove.length} inactive or invalid device token(s)...`);
        await User.updateMany(
          { fcmTokens: { $in: tokensToRemove } },
          { $pull: { fcmTokens: { $in: tokensToRemove } } }
        );
      }
    }
  } catch (error) {
    console.error('Error sending push notification:', error.message);
  }
};

module.exports = {
  sendPushNotification
};

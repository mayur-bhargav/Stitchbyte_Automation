// Firebase Configuration
// This file configures Firebase for the frontend application

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const logDebug = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

const firebaseConfig = {
  apiKey: "AIzaSyCnx0Cth8wr4DNnnIL9J2aeUDw6j8WCXU0",
  authDomain: "ganges-17474.firebaseapp.com",
  projectId: "ganges-17474",
  storageBucket: "ganges-17474.appspot.com",
  messagingSenderId: "223384815478",
  appId: "1:223384815478:web:990eeb51977ebcbb855c57",
  measurementId: "G-VJ1X52L4CH"
};

// VAPID Key for Web Push
const VAPID_KEY = "BF2jC9vInQMZ-rvUDn2WX6OTNi-VkkesobuAE6Yi87lG8OV3P1OQ-WJwbgOzKHwyQnPE4E1wxfrtnqcXUEeCwiU";

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Cloud Messaging
let messaging: any = null;

// Check if we're in a browser environment and messaging is supported
if (typeof window !== 'undefined') {
  isSupported().then((supported: boolean) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

/**
 * Request FCM token from Firebase
 * This token is used to send push notifications to this device
 */
export async function requestFCMToken(): Promise<string | null> {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      logDebug('Not in browser environment');
      return null;
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      logDebug('This browser does not support notifications');
      return null;
    }

    // Check if permission is granted
    if (Notification.permission !== 'granted') {
      logDebug('Notification permission not granted');
      return null;
    }

    // Check if messaging is supported
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      logDebug('Firebase messaging not supported in this browser');
      return null;
    }

    // Initialize messaging if not already done
    if (!messaging) {
      messaging = getMessaging(app);
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    logDebug('Service Worker registered:', registration);

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      logDebug('✅ FCM Token obtained:', token.substring(0, 20) + '...');
      return token;
    } else {
      logDebug('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Setup foreground message handler
 * This handles messages when the app is in the foreground
 */
export function setupForegroundMessageHandler(callback: (payload: any) => void) {
  if (messaging) {
    onMessage(messaging, (payload: any) => {
      logDebug('Foreground message received:', payload);
      callback(payload);
      
      // Show notification
      if (payload.notification) {
        new Notification(payload.notification.title || 'New Notification', {
          body: payload.notification.body || '',
          icon: payload.notification.icon || '/favicon.ico',
          badge: '/favicon.ico',
        });
      }
    });
  }
}

export { app, messaging, VAPID_KEY };

import { messaging, getToken, onMessage, VAPID_KEY } from '../firebase/config';
import { supabase } from './supabase';

export async function requestNotificationPermission(nickname: string) {
  try {
    if (!messaging) {
      console.log('Messaging not supported');
      return null;
    }

    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token) {
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('No FCM token received');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

export function setupForegroundNotifications(callback: (payload: any) => void) {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
    
    if (Notification.permission === 'granted') {
      new Notification(payload.notification?.title || 'New message', {
        body: payload.notification?.body || '',
        icon: '/icon.png'
      });
    }
  });
}

export async function saveFCMToken(communityId: string, nickname: string, fcmToken: string) {
  const { error } = await supabase
    .from('community_members')
    .update({ fcm_token: fcmToken })
    .eq('community_id', communityId)
    .eq('user_nickname', nickname);

  if (error) {
    console.error('Error saving FCM token:', error);
  }
}

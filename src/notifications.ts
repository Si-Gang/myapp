import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Schedule } from './types';
import { loadArticles } from './store-reading';

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function ensureChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '默认通知',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

const READING_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export async function scheduleReadingReminder() {
  const articles = await loadArticles();
  if (articles.length === 0) return;

  // Cancel all existing reading reminders
  for (const h of READING_HOURS) {
    await Notifications.cancelScheduledNotificationAsync(`reading-${h}`);
  }

  // Schedule one per hour, cycling through articles if needed
  for (let i = 0; i < READING_HOURS.length; i++) {
    const article = articles[i % articles.length];
    await Notifications.scheduleNotificationAsync({
      identifier: `reading-${READING_HOURS[i]}`,
      content: {
        title: `📖 ${article.title}`,
        body: article.excerpt,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: READING_HOURS[i],
        minute: 0,
      },
    });
  }
}

export async function scheduleDeadlineReminders(schedules: Schedule[]) {
  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of allScheduled) {
    if (n.identifier.startsWith('deadline-')) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  const now = Date.now();

  for (const schedule of schedules) {
    if (schedule.completed) continue;

    const deadline = new Date(schedule.deadline).getTime();
    if (deadline <= now) continue;

    const triggerTime = deadline - 30 * 60 * 1000;
    if (triggerTime <= now) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `deadline-${schedule.id}`,
      content: {
        title: '⏰ 日程提醒',
        body: `"${schedule.title}" 还有30分钟`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerTime),
      },
    });
  }
}

export async function initializeNotifications(schedules?: Schedule[]) {
  const granted = await requestPermissions();
  if (!granted) return false;

  await ensureChannel();
  await scheduleReadingReminder();

  if (schedules) {
    await scheduleDeadlineReminders(schedules);
  }

  return true;
}

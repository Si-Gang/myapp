import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Schedule } from './types';

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
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

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

export async function scheduleReadingReminder() {
  await Notifications.cancelScheduledNotificationAsync('reading-reminder');

  await Notifications.scheduleNotificationAsync({
    identifier: 'reading-reminder',
    content: {
      title: '📖 阅读推送',
      body: '打开看看今天有什么好文章吧',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 19,
      minute: 55,
    },
  });
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

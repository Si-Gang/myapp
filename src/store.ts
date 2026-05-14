import AsyncStorage from '@react-native-async-storage/async-storage';
import { Schedule } from './types';

const STORAGE_KEY = '@schedules';

export async function loadSchedules(): Promise<Schedule[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      return JSON.parse(json);
    }
  } catch {}
  return [];
}

export async function saveSchedules(schedules: Schedule[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  } catch {}
}

import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import TimetableScreen from './src/screens/TimetableScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import ReadingListScreen from './src/screens/ReadingListScreen';
import MoreScreen from './src/screens/MoreScreen';
import Icon from './src/components/Icon';
import { loadSchedules } from './src/store';
import { syncPool } from './src/store-reading';
import {
  setupNotificationHandler,
  scheduleReadingReminder,
  scheduleDeadlineReminders,
  requestPermissions,
} from './src/notifications';

type Page = 'timetable' | 'schedule' | 'reading' | 'more';

setupNotificationHandler();

export default function App() {
  const [page, setPage] = useState<Page>('timetable');
  const [tabBarVisible, setTabBarVisible] = useState(true);

  useEffect(() => {
    syncPool();
    requestPermissions().then((granted) => {
      if (granted) {
        scheduleReadingReminder();
        loadSchedules().then((s) => scheduleDeadlineReminders(s));
      }
    });
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />

      {page === 'timetable' && <TimetableScreen />}
      {page === 'schedule' && <ScheduleScreen />}
      {page === 'reading' && (
        <ReadingListScreen onReaderOpen={setTabBarVisible} />
      )}
      {page === 'more' && <MoreScreen />}

      {tabBarVisible && (
        <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, page === 'timetable' && styles.tabActive]}
          activeOpacity={0.7}
          onPress={() => setPage('timetable')}
        >
          <Icon
            name="schedule"
            size={20}
            color={page === 'timetable' ? '#FF6B35' : '#B2BEC3'}
          />
          <Text style={[styles.tabLabel, page === 'timetable' && styles.tabLabelActive]}>
            课表
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, page === 'schedule' && styles.tabActive]}
          activeOpacity={0.7}
          onPress={() => setPage('schedule')}
        >
          <Icon
            name="tasks"
            size={20}
            color={page === 'schedule' ? '#FF6B35' : '#B2BEC3'}
          />
          <Text style={[styles.tabLabel, page === 'schedule' && styles.tabLabelActive]}>
            日程
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, page === 'reading' && styles.tabActive]}
          activeOpacity={0.7}
          onPress={() => setPage('reading')}
        >
          <Icon
            name="reader"
            size={20}
            color={page === 'reading' ? '#FF6B35' : '#B2BEC3'}
          />
          <Text style={[styles.tabLabel, page === 'reading' && styles.tabLabelActive]}>
            阅读
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, page === 'more' && styles.tabActive]}
          activeOpacity={0.7}
          onPress={() => setPage('more')}
        >
          <Icon
            name="more"
            size={20}
            color={page === 'more' ? '#FF6B35' : '#B2BEC3'}
          />
          <Text style={[styles.tabLabel, page === 'more' && styles.tabLabelActive]}>
            更多
          </Text>
        </TouchableOpacity>
      </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF8F5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#FFD1BA',
    paddingBottom: 22,
    paddingTop: 6,
    paddingHorizontal: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 3,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FFF1EB',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B2BEC3',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#FF6B35',
  },
});


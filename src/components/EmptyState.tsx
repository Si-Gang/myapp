import { StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';

export default function EmptyState() {
  return (
    <View style={styles.container}>
      <Icon name="empty-state" size={64} color="#B2BEC3" style={styles.icon} />
      <Text style={styles.title}>还没有日程</Text>
      <Text style={styles.subtitle}>点击下方按钮添加新日程</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#B2BEC3',
  },
});

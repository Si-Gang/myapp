import { StyleSheet, Text, View } from 'react-native';
import Icon from '../components/Icon';

export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <Icon name="empty-state" size={64} color="#B2BEC3" style={styles.icon} />
      <Text style={styles.title}>更多功能</Text>
      <Text style={styles.subtitle}>敬请期待</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D3436',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#B2BEC3',
  },
});

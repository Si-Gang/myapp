import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Article } from '../types';

interface Props {
  article: Article;
  onBack: () => void;
}

export default function ReaderView({ article, onBack }: Props) {
  const [loading, setLoading] = useState(true);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Articles with a link: show WebView for full original content
  if (article.link) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backText}>{'← 返回'}</Text>
          </TouchableOpacity>
          <Text style={styles.source} numberOfLines={1}>
            {article.source}
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingBar}>
            <ActivityIndicator size="small" color="#FF6B35" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        )}

        <WebView
          source={{ uri: article.link }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
    );
  }

  // Articles without a link (seed data): show text reader
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>{'← 返回'}</Text>
        </TouchableOpacity>
        <Text style={styles.source}>{article.source}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{article.title}</Text>

        <View style={styles.meta}>
          <Text style={styles.author}>{article.author}</Text>
          <Text style={styles.date}>{formatDate(article.publishedAt)}</Text>
        </View>

        <View style={styles.divider} />

        {article.content.split('\n\n').map((para, i) => (
          <Text key={i} style={styles.para}>
            {para.trim()}
          </Text>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>— 阅读推送 · 每日好文 —</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF8F5',
  },
  header: {
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  source: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
    textAlign: 'right',
  },
  loadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFF8F5',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#B2BEC3',
  },
  webview: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D3436',
    lineHeight: 34,
    marginBottom: 16,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  author: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B35',
  },
  date: {
    fontSize: 13,
    color: '#B2BEC3',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFD1BA',
    marginBottom: 20,
  },
  para: {
    fontSize: 17,
    lineHeight: 30,
    color: '#2D3436',
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#B2BEC3',
  },
});

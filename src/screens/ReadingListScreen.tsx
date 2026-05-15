import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Article } from '../types';
import { loadArticles, refillAfterCleanup } from '../store-reading';
import ReaderView from '../components/ReaderView';

interface Props {
  onReaderOpen: (visible: boolean) => void;
}

export default function ReadingListScreen({ onReaderOpen }: Props) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState<Article | null>(null);
  const [showCleanup, setShowCleanup] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadArticles().then(setArticles);
  }, []);

  const handleOpenArticle = useCallback(
    (article: Article) => {
      setReadIds((prev) => new Set(prev).add(article.id));
      setSelected(article);
      onReaderOpen(false);
    },
    [onReaderOpen]
  );

  const handleBack = useCallback(() => {
    setSelected(null);
    onReaderOpen(true);
  }, [onReaderOpen]);

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const cleanupTargets = articles.filter(
    (a) => (now - new Date(a.publishedAt).getTime()) > 7 * DAY_MS || readIds.has(a.id)
  );

  const handleCleanup = useCallback(() => {
    setShowCleanup(true);
  }, []);

  const handleConfirmCleanup = useCallback(() => {
    const remaining = articles.filter(
      (a) =>
        (now - new Date(a.publishedAt).getTime()) <= 7 * DAY_MS &&
        !readIds.has(a.id)
    );
    const removedIds = articles
      .filter((a) => !remaining.includes(a))
      .map((a) => a.id);
    refillAfterCleanup(remaining, removedIds).then(setArticles);
    setShowCleanup(false);
  }, [articles, readIds]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>阅读推送</Text>
        <View style={styles.headerRow}>
          <Text style={styles.headerCount}>
            {articles.length > 0 ? `${articles.length} 篇文章` : ''}
          </Text>
          {cleanupTargets.length > 0 && (
            <TouchableOpacity style={styles.cleanupBtn} onPress={handleCleanup}>
              <Text style={styles.cleanupText}>清理旧文/已读</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handleOpenArticle(item)}
          >
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardExcerpt} numberOfLines={3}>
              {item.excerpt}
            </Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardAuthor}>{item.author}</Text>
              <Text style={styles.cardDate}>{formatDate(item.publishedAt)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {selected && (
        <View style={styles.readerOverlay}>
          <ReaderView article={selected} onBack={handleBack} />
        </View>
      )}

      <Modal visible={showCleanup} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>清理文章</Text>
            <Text style={styles.confirmMessage}>
              确定删除 {cleanupTargets.length} 篇旧文或已读文章吗？此操作不可撤销。
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmCancelBtn]}
                onPress={() => setShowCleanup(false)}
              >
                <Text style={styles.confirmCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmDeleteBtn]}
                onPress={handleConfirmCleanup}
              >
                <Text style={styles.confirmDeleteText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF8F5',
  },
  readerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },
  header: {
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FF6B35',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  headerCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  cleanupBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  cleanupText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD1BA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
    lineHeight: 24,
  },
  cardExcerpt: {
    fontSize: 14,
    color: '#636E72',
    lineHeight: 21,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAuthor: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '600',
  },
  cardDate: {
    fontSize: 12,
    color: '#B2BEC3',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  confirmDialog: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 10,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelBtn: {
    backgroundColor: '#F0F0F0',
  },
  confirmCancelText: {
    fontSize: 15,
    color: '#636E72',
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    backgroundColor: '#FF4757',
  },
  confirmDeleteText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
});

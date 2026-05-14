import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface Props {
  items: { label: string; value: number }[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  loop?: boolean;
}

const ITEM_HEIGHT = 36;
const VISIBLE_COUNT = 5;
const HALF = Math.floor(VISIBLE_COUNT / 2);
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const CENTER_Y = CONTAINER_HEIGHT / 2;
const MAX_ANGLE = 55;
const PERSPECTIVE = 500;
const REPEAT = 100;

export default function WheelPicker({ items, selectedValue, onValueChange, loop = false }: Props) {
  const flatListRef = useRef<FlatList<any>>(null);
  const selectedIndex = Math.max(0, items.findIndex((i) => i.value === selectedValue));

  const itemsKey = useMemo(() => items.map((i) => i.value).join(','), [items]);

  const data = useMemo(() => {
    if (!loop) return items;
    const result: { label: string; value: number }[] = [];
    for (let i = 0; i < REPEAT; i++) {
      for (const item of items) {
        result.push(item);
      }
    }
    return result;
  }, [items, loop, itemsKey]);

  const baseIndex = loop ? items.length * Math.floor(REPEAT / 2) : 0;
  const initialIndex = baseIndex + selectedIndex;

  const [scrollY, setScrollY] = useState(initialIndex * ITEM_HEIGHT);
  const scrollYRef = useRef(scrollY);
  const isScrollingRef = useRef(false);
  const animatingRef = useRef(false);

  // Keep ref in sync so useEffect always reads latest position
  scrollYRef.current = scrollY;

  // Sync external value changes when not actively scrolling
  useEffect(() => {
    if (selectedIndex < 0) return;
    if (isScrollingRef.current) return;
    if (animatingRef.current) return;

    const currentY = scrollYRef.current;
    const currentIndex = Math.round(currentY / ITEM_HEIGHT);
    let targetIndex: number;
    if (loop) {
      const maxCycle = REPEAT - 1;
      const cycle = Math.max(0, Math.min(maxCycle, Math.floor(currentIndex / items.length)));
      targetIndex = cycle * items.length + selectedIndex;
    } else {
      targetIndex = selectedIndex;
    }

    if (currentIndex !== targetIndex) {
      flatListRef.current?.scrollToIndex({ index: targetIndex, animated: false });
    }
  }, [selectedIndex, loop, items.length]);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const resolveValue = useCallback(
    (y: number) => {
      const index = Math.round(y / ITEM_HEIGHT);
      const realIndex = loop
        ? ((index % items.length) + items.length) % items.length
        : Math.max(0, Math.min(index, items.length - 1));
      return items[realIndex]?.value;
    },
    [items, loop]
  );

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(e.nativeEvent.contentOffset.y);
  }, []);

  const onScrollBeginDrag = useCallback(() => {
    isScrollingRef.current = true;
    animatingRef.current = false;
  }, []);

  const onScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const vel = e.nativeEvent.velocity?.y ?? 0;
      if (Math.abs(vel) < 0.5) {
        // Slow drag, no momentum — settle immediately
        isScrollingRef.current = false;
        const v = resolveValue(e.nativeEvent.contentOffset.y);
        if (v != null) onValueChange(v);
      }
      // Fast flings: let onMomentumScrollEnd handle it
    },
    [onValueChange, resolveValue]
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrollingRef.current = false;
      const v = resolveValue(e.nativeEvent.contentOffset.y);
      if (v != null) onValueChange(v);
    },
    [onValueChange, resolveValue]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: { label: string; value: number }; index: number }) => {
      const itemCenter = index * ITEM_HEIGHT + ITEM_HEIGHT / 2;
      const distanceFromCenter = (itemCenter - scrollY - CENTER_Y + ITEM_HEIGHT * HALF) / CENTER_Y;
      const absDist = Math.abs(distanceFromCenter);
      const clamped = Math.min(absDist, 1);
      const angle = distanceFromCenter * MAX_ANGLE;
      const scale = 1 - clamped * 0.25;
      const opacity = 1 - clamped * 0.45;

      return (
        <View style={styles.item}>
          <Text
            style={[
              styles.itemText,
              {
                transform: [
                  { perspective: PERSPECTIVE },
                  { rotateX: `${angle}deg` },
                  { scale },
                ],
                opacity,
              },
            ]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        </View>
      );
    },
    [scrollY]
  );

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate={0.85}
        getItemLayout={getItemLayout}
        initialScrollIndex={initialIndex}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentContainerStyle={styles.listContent}
        maxToRenderPerBatch={VISIBLE_COUNT * 3}
        windowSize={VISIBLE_COUNT * 5}
        removeClippedSubviews={true}
      />
      <View style={styles.highlightBar} pointerEvents="none" />
      <View style={styles.fadeTop} pointerEvents="none" />
      <View style={styles.fadeBottom} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: CONTAINER_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
  },
  listContent: {
    paddingVertical: ITEM_HEIGHT * HALF,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  itemText: {
    fontSize: 15,
    color: '#636E72',
    fontWeight: '600',
  },
  highlightBar: {
    position: 'absolute',
    top: ITEM_HEIGHT * HALF,
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    backgroundColor: '#FFF8F5',
    zIndex: -1,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * HALF,
    backgroundColor: 'rgba(250,250,250,0.9)',
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * HALF,
    backgroundColor: 'rgba(250,250,250,0.9)',
  },
});

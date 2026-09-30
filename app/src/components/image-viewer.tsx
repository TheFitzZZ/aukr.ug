import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors, Spacing } from '@/constants/theme';

import { AppText } from './app-text';

export interface ViewerImage {
  uri: string;
  alt: string;
}

const MAX_SCALE = 5;

function ZoomableImage({ image, onSwipe }: { image: ViewerImage; onSwipe: (direction: 1 | -1) => void }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const reset = () => {
    'worklet';
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedX.value = 0;
    savedY.value = 0;
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(MAX_SCALE, Math.max(1, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.01) reset();
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedX.value + e.translationX;
        translateY.value = savedY.value + e.translationY;
      }
    })
    .onEnd((e) => {
      if (scale.value > 1) {
        savedX.value = translateX.value;
        savedY.value = translateY.value;
      } else if (Math.abs(e.translationX) > 60 && Math.abs(e.translationX) > Math.abs(e.translationY)) {
        scheduleOnRN(onSwipe, e.translationX < 0 ? 1 : -1);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) reset();
      else {
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
      }
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
      <Animated.View style={[styles.imageWrap, style]}>
        <Image source={image.uri} alt={image.alt} style={styles.image} contentFit="contain" accessibilityLabel={image.alt} />
      </Animated.View>
    </GestureDetector>
  );
}

/** Full-screen viewer with pinch-to-zoom, double tap and swipe between images. */
export function ImageViewer({ images, index, onClose }: { images: ViewerImage[]; index: number | null; onClose: () => void }) {
  const [current, setCurrent] = useState(index ?? 0);
  useEffect(() => {
    if (index !== null) setCurrent(index);
  }, [index]);
  const image = images[current];
  const go = (direction: 1 | -1) => setCurrent((c) => (c + direction + images.length) % images.length);

  return (
    <Modal visible={index !== null && Boolean(image)} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={styles.root}>
          <View style={styles.toolbar}>
            <AppText style={styles.counter}>{images.length > 1 ? `${current + 1} / ${images.length}` : ''}</AppText>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Schließen" hitSlop={12} style={styles.close}>
              <Ionicons name="close" size={30} color={Colors.onDark} />
            </Pressable>
          </View>
          {image ? <ZoomableImage key={image.uri} image={image} onSwipe={go} /> : null}
          {images.length > 1 ? (
            <View style={styles.nav}>
              <Pressable onPress={() => go(-1)} accessibilityRole="button" accessibilityLabel="Vorheriges Bild" hitSlop={12}>
                <Ionicons name="chevron-back" size={32} color={Colors.onDark} />
              </Pressable>
              <Pressable onPress={() => go(1)} accessibilityRole="button" accessibilityLabel="Nächstes Bild" hitSlop={12}>
                <Ionicons name="chevron-forward" size={32} color={Colors.onDark} />
              </Pressable>
            </View>
          ) : null}
          <AppText style={styles.caption} numberOfLines={3}>
            {image?.alt}
          </AppText>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
  counter: { color: Colors.onDarkMuted },
  close: { padding: 4 },
  imageWrap: { flex: 1 },
  image: { flex: 1 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  caption: { color: Colors.onDarkMuted, textAlign: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, fontSize: 14 },
});

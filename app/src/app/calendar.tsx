import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { resolveSiteUrl } from '@aukrug/content';

import { AppText } from '@/components/app-text';
import { ImageViewer } from '@/components/image-viewer';
import { Screen } from '@/components/screen';
import { Colors, Radius } from '@/constants/theme';
import { useContent } from '@/content/content-context';

export default function CalendarScreen() {
  const { bundle } = useContent();
  const { calendar } = bundle.events;
  const [zoom, setZoom] = useState<number | null>(null);
  const image = { uri: resolveSiteUrl(calendar.image, bundle.site.websiteUrl), alt: calendar.alt };

  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        {calendar.title}
      </AppText>
      <Pressable accessibilityRole="imagebutton" accessibilityLabel={`${calendar.alt}, vergrößern`} onPress={() => setZoom(0)}>
        <Image source={image.uri} alt={calendar.alt} style={styles.image} contentFit="contain" transition={200} />
      </Pressable>
      <AppText variant="caption">Tippen zum Vergrößern – mit zwei Fingern zoomen.</AppText>
      <ImageViewer images={[image]} index={zoom} onClose={() => setZoom(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 0.7, borderRadius: Radius.md, backgroundColor: Colors.surface },
});

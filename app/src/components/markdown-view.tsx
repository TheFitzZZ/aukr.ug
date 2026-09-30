import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';

import { parseInline, parseMarkdown, resolveSiteUrl, type Block, type Inline } from '@aukrug/content';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useContent } from '@/content/content-context';
import { openLink } from '@/services/links';

import { AppText } from './app-text';
import { ImageViewer } from './image-viewer';

function Inlines({ items, style, linkColor }: { items: Inline[]; style?: StyleProp<TextStyle>; linkColor?: string }) {
  const { bundle } = useContent();
  return items.map((item, index) => {
    if (item.type === 'bold') {
      return (
        <AppText key={index} style={[style, styles.bold]}>
          {item.text}
        </AppText>
      );
    }
    if (item.type === 'link') {
      return (
        <AppText
          key={index}
          accessibilityRole="link"
          onPress={() => openLink(item.url, bundle.site)}
          style={[style, styles.link, linkColor ? { color: linkColor } : null]}>
          {item.text}
        </AppText>
      );
    }
    return (
      <AppText key={index} style={style}>
        {item.text}
      </AppText>
    );
  });
}

/** Renders `**bold**` and `[links](url)` inside running text. */
export function InlineText({ source, style, linkColor }: { source: string; style?: StyleProp<TextStyle>; linkColor?: string }) {
  return <Inlines items={parseInline(source)} style={style} linkColor={linkColor} />;
}

function Gallery({ images }: { images: { src: string; alt: string }[] }) {
  const { bundle } = useContent();
  const [open, setOpen] = useState<number | null>(null);
  const resolved = images.map((i) => ({ uri: resolveSiteUrl(i.src, bundle.site.websiteUrl), alt: i.alt }));
  const single = resolved.length === 1;
  const items = resolved.map((image, index) => (
    <Pressable
      key={image.uri}
      accessibilityRole="imagebutton"
      accessibilityLabel={`${image.alt}, vergrößern`}
      onPress={() => setOpen(index)}>
      <Image
        source={image.uri}
        alt={image.alt}
        style={single ? styles.singleImage : styles.galleryImage}
        contentFit="cover"
        transition={200}
      />
    </Pressable>
  ));
  return (
    <>
      {single ? (
        items
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
          {items}
        </ScrollView>
      )}
      <ImageViewer images={resolved} index={open} onClose={() => setOpen(null)} />
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      return (
        <AppText variant={block.level === 3 ? 'strong' : 'subheading'} accessibilityRole="header" style={block.level === 1 && styles.h1}>
          {block.text}
        </AppText>
      );
    case 'paragraph':
      return (
        <AppText>
          <Inlines items={block.content} />
        </AppText>
      );
    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <AppText>•</AppText>
              <AppText style={styles.listText}>
                <Inlines items={item} />
              </AppText>
            </View>
          ))}
        </View>
      );
    case 'gallery':
      return <Gallery images={block.images} />;
  }
}

export function MarkdownView({ source }: { source: string }) {
  const blocks = parseMarkdown(source);
  return (
    <View style={styles.container}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  h1: { fontFamily: Fonts.black, fontSize: 24 },
  bold: { fontFamily: Fonts.bold, color: Colors.heading },
  link: { color: Colors.accent, textDecorationLine: 'underline' },
  list: { gap: Spacing.xs },
  listItem: { flexDirection: 'row', gap: Spacing.sm },
  listText: { flex: 1 },
  gallery: { gap: Spacing.sm },
  galleryImage: { width: 240, height: 170, borderRadius: Radius.md, backgroundColor: Colors.surface },
  singleImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.md, backgroundColor: Colors.surface },
});

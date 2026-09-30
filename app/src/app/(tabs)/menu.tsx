import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, SectionList, StyleSheet, TextInput, View } from 'react-native';

import { formatPrice, resolveSiteUrl, type MenuCategory, type MenuItem } from '@aukrug/content';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Colors, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useContent } from '@/content/content-context';
import { filterMenu } from '@/content/menu';
import { trackEvent } from '@/services/firebase';
import { openLink } from '@/services/links';

function MenuItemRow({ item }: { item: MenuItem }) {
  const vegetarian = item.tags.includes('vegetarian');
  return (
    <View style={styles.item}>
      <View style={styles.itemHead}>
        <AppText style={styles.itemName}>
          {item.name}
          {vegetarian ? '  ' : ''}
          {vegetarian ? <Ionicons name="leaf" size={15} color={Colors.open} accessibilityLabel="vegetarisch" /> : null}
        </AppText>
        {item.price !== undefined ? <AppText style={styles.price}>{formatPrice(item.price)}</AppText> : null}
      </View>
      {item.description ? <AppText variant="small">{item.description}</AppText> : null}
      {item.variants.map((variant) => (
        <View key={variant.label} style={styles.subRow}>
          <AppText variant="small" style={styles.subLabel}>
            {variant.label}
          </AppText>
          <AppText style={styles.price}>{formatPrice(variant.price)}</AppText>
        </View>
      ))}
      {item.options.map((option) => (
        <View key={option.label} style={styles.subRow}>
          <AppText variant="small" style={styles.subLabel}>
            + {option.label}
          </AppText>
          <AppText variant="small" style={styles.surcharge}>
            + {formatPrice(option.surcharge)}
          </AppText>
        </View>
      ))}
      {item.choices.length ? (
        <View style={styles.choices}>
          {item.choices.map((choice) => (
            <View key={choice} style={styles.choice}>
              <AppText variant="small">{choice}</AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function MenuScreen() {
  const { bundle, refreshing, refresh } = useContent();
  const { menu, site } = bundle;
  const [query, setQuery] = useState('');
  const list = useRef<SectionList<MenuItem, MenuCategory>>(null);
  const categories = useMemo(() => filterMenu(menu.categories, query), [menu.categories, query]);
  const sections = categories.map((c) => ({ ...c, data: c.items }));

  const jumpTo = (index: number) =>
    list.current?.scrollToLocation({ sectionIndex: index, itemIndex: 0, viewOffset: 0, viewPosition: 0 });

  const openPdf = () => {
    trackEvent('open_menu_pdf');
    openLink(resolveSiteUrl(site.menuPdf, site.websiteUrl), site);
  };

  return (
    <SectionList
      ref={list}
      style={styles.list}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      sections={sections}
      keyExtractor={(item, index) => `${item.name}-${index}`}
      stickySectionHeadersEnabled={false}
      // The menu is short; rendering everything keeps category jumps reliable.
      initialNumToRender={120}
      keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refresh({ force: true })} tintColor={Colors.accent} />}
      onScrollToIndexFailed={() => {}}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppText variant="title">{menu.title}</AppText>
          {menu.intro ? <AppText>{menu.intro}</AppText> : null}
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={Colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Gericht suchen …"
              placeholderTextColor={Colors.muted}
              style={styles.searchInput}
              accessibilityLabel="Speisekarte durchsuchen"
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoCorrect={false}
            />
          </View>
          {!query ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {categories.map((category, index) => (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Zu ${category.title} springen`}
                  onPress={() => jumpTo(index)}
                  style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
                  <AppText style={styles.chipText}>{category.title}</AppText>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <AppText variant="heading" accessibilityRole="header">
            {section.title}
          </AppText>
          {section.subtitle ? <AppText style={styles.subtitle}>{section.subtitle}</AppText> : null}
        </View>
      )}
      renderItem={({ item }) => <MenuItemRow item={item} />}
      ListEmptyComponent={<AppText style={styles.empty}>Kein Gericht gefunden.</AppText>}
      ListFooterComponent={
        <View style={styles.footer}>
          {menu.footnote ? <AppText variant="caption">{menu.footnote}</AppText> : null}
          <Button label="Speisekarte als PDF" variant="secondary" icon="document-text-outline" onPress={openPdf} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: Colors.page },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: { gap: Spacing.md, paddingTop: Spacing.md },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
  },
  searchInput: { flex: 1, minHeight: 44, fontFamily: Fonts.regular, fontSize: 16, color: Colors.heading },
  chips: { gap: Spacing.sm },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 8 },
  chipPressed: { backgroundColor: Colors.surface },
  chipText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.heading },
  sectionHeader: { marginTop: Spacing.xl, marginBottom: Spacing.sm, paddingBottom: Spacing.sm, borderBottomWidth: 2, borderColor: Colors.ink, gap: 2 },
  subtitle: { fontFamily: Fonts.italic, color: Colors.muted, fontSize: 15 },
  item: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, gap: 2 },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  itemName: { flex: 1, fontFamily: Fonts.bold, fontSize: 17, color: Colors.heading },
  price: { fontFamily: Fonts.bold, color: Colors.heading, fontVariant: ['tabular-nums'] },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, paddingLeft: Spacing.sm },
  subLabel: { flex: 1 },
  surcharge: { color: Colors.heading, fontVariant: ['tabular-nums'] },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  choice: { backgroundColor: Colors.surface, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  empty: { marginTop: Spacing.lg, textAlign: 'center' },
  footer: { gap: Spacing.md, marginTop: Spacing.lg },
});

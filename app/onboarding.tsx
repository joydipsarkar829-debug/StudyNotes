import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useAppStore } from '@/store';

const { width } = Dimensions.get('window');

const pages = [
  {
    icon: 'book-open-variant' as const,
    title: 'Welcome to Study Notes',
    description: 'Your all-in-one educational notes application. Organize subjects, chapters, notes, and study materials in one place.',
    color: '#4A90D9',
  },
  {
    icon: 'folder-multiple' as const,
    title: 'Organize Your Studies',
    description: 'Create subjects, add chapters, and take detailed notes. Track your progress and stay on top of your studies.',
    color: '#7C5CFC',
  },
  {
    icon: 'cloud-off-outline' as const,
    title: 'Offline First',
    description: 'All your data is stored locally on your device. No internet required. Your notes are always available, even offline.',
    color: '#10B981',
  },
  {
    icon: 'palette' as const,
    title: 'Choose Your Theme',
    description: 'Personalize your experience with light mode, dark mode, or follow your system settings.',
    color: '#F59E0B',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { setOnboarded } = useAppStore();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      const next = currentPage + 1;
      setCurrentPage(next);
      scrollViewRef.current?.scrollTo({ x: next * width, animated: true });
    } else {
      finish();
    }
  };

  const handleSkip = () => {
    finish();
  };

  const finish = () => {
    setOnboarded(true);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip} accessibilityLabel="Skip onboarding">
        <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentPage(page);
        }}
        scrollEnabled={false}
      >
        {pages.map((page, index) => (
          <View key={index} style={[styles.page, { width }]}>
            <View style={[styles.iconContainer, { backgroundColor: page.color + '15' }]}>
              <MaterialCommunityIcons name={page.icon} size={80} color={page.color} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>{page.title}</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{page.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.dots}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentPage ? pages[currentPage].color : theme.colors.border,
                  width: index === currentPage ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: pages[currentPage].color }]}
          onPress={handleNext}
          accessibilityLabel={currentPage === pages.length - 1 ? 'Get Started' : 'Next'}
          accessibilityRole="button"
        >
          <Text style={styles.nextText}>
            {currentPage === pages.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <MaterialCommunityIcons
            name={currentPage === pages.length - 1 ? 'check' : 'arrow-right'}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipButton: { position: 'absolute', top: 56, right: 20, zIndex: 10, padding: 8 },
  skipText: { fontSize: 16, fontWeight: '500' },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconContainer: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  description: { fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 10 },
  bottomSection: { paddingHorizontal: 24, paddingBottom: 60, paddingTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  nextButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 24, gap: 8 },
  nextText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onFocus,
}) => {
  const theme = useTheme();
  const [localValue, setLocalValue] = useState(value);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChangeText = useCallback(
    (text: string) => {
      setLocalValue(text);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        onChangeText(text);
      }, 300);
    },
    [onChangeText],
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChangeText('');
  }, [onChangeText]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: theme.borderRadius.md,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="magnify"
        size={20}
        color={theme.colors.textMuted}
        style={styles.searchIcon}
      />
      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.text,
            fontSize: theme.fontSize.md,
          },
        ]}
        value={localValue}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        onFocus={onFocus}
        returnKeyType="search"
        accessibilityLabel={placeholder}
      />
      {localValue.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={[styles.clearButton, { borderRadius: theme.borderRadius.sm }]}
          accessibilityLabel="Clear search"
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={18}
            color={theme.colors.textMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default React.memo(SearchBar);

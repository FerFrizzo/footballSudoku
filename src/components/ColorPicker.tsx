import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRESET_COLORS = [
  '#D32F2F', '#C62828', '#AD1457', '#6A1B9A',
  '#4527A0', '#283593', '#1565C0', '#0277BD',
  '#00838F', '#00695C', '#2E7D32', '#1B5E20',
  '#558B2F', '#9E9D24', '#F9A825', '#FF8F00',
  '#EF6C00', '#D84315', '#4E342E', '#37474F',
  '#212121', '#FFFFFF', '#FFD600', '#FF6D00',
];

const LIGHT_COLORS = new Set(['#FFFFFF', '#FFD600', '#F9A825', '#FF8F00', '#9E9D24', '#558B2F']);

interface ColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
  disabledColor?: string;
}

export default function ColorPicker({ selectedColor, onSelect, disabledColor }: ColorPickerProps) {
  return (
    <View style={styles.container}>
      {PRESET_COLORS.map((color) => {
        const isSelected = selectedColor.toLowerCase() === color.toLowerCase();
        const isDisabled = !!disabledColor && disabledColor.toLowerCase() === color.toLowerCase();
        return (
          <Pressable
            key={color}
            onPress={() => { if (!isDisabled) onSelect(color); }}
            style={[
              styles.swatch,
              {
                backgroundColor: color,
                borderColor: color === '#FFFFFF' ? '#E0E0E0' : color,
                borderWidth: isSelected ? 3 : 1,
                opacity: isDisabled ? 0.25 : 1,
              },
            ]}
          >
            {isSelected && !isDisabled && (
              <Ionicons
                name="checkmark"
                size={18}
                color={LIGHT_COLORS.has(color) ? '#000' : '#FFF'}
              />
            )}
            {isDisabled && (
              <Ionicons
                name="close"
                size={16}
                color={LIGHT_COLORS.has(color) ? '#000' : '#FFF'}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

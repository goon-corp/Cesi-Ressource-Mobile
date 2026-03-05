import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';

interface AvatarProps {
  name: string;
  size?: number;
  imageUri?: string;
  backgroundColor?: string;
  textColor?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  size = 40,
  imageUri,
  backgroundColor = '#000091',
  textColor = '#FFFFFF',
}: AvatarProps) {
  const fontSize = Math.floor(size * 0.38);

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <AppText
          style={{
            color: textColor,
            fontSize,
            fontWeight: '700',
            includeFontPadding: false,
          }}
        >
          {getInitials(name)}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

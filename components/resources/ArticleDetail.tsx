import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { BorderRadius, Spacing } from '@/constants/Spacing';
import type { ApiArticle } from '@/types/resource.types';

interface ArticleDetailProps {
  article: ApiArticle;
}

export function ArticleDetail({ article }: ArticleDetailProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.content,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
      ]}
    >
      <AppText variant="body" style={{ lineHeight: 24 }}>
        {article.content}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});

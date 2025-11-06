import { computed } from 'vue';
import { useThemeVars } from 'naive-ui';

export function useDialogBackground() {
  const themeVars = useThemeVars();

  const dialogBackgroundColor = computed(() => {
    const bodyColor = themeVars.value.bodyColor;
    // Check if dark theme (dark body color)
    if (bodyColor && (bodyColor === '#1a1a1a' || bodyColor.includes('1a1a1a'))) {
      // Use a lighter shade than input fields (#2a2a2a) for better contrast
      return '#333333';
    }
    // Light theme - use light gray background
    return '#f5f5f5';
  });

  return {
    dialogBackgroundColor
  };
}


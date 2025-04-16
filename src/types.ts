import type { ViewStyle } from 'react-native';

export interface RangeSliderProps {
  // Core props
  initialMinValue?: number;
  initialMaxValue?: number;
  min: number;
  max: number;
  step?: number;

  // Style props
  selectedTrackStyle?: ViewStyle;
  unselectedTrackStyle?: ViewStyle;
  thumbStyle?: ViewStyle;
  pressedThumbStyle?: ViewStyle;
  containerStyle?: ViewStyle;
  selectedTrackColor?: string;

  // Customization props
  width?: number;
  thumbSize?: number;
  trackHeight?: number;
  minimumDistance?: number;

  // Behavior props
  enabled?: boolean;
  allowOverlap?: boolean;

  // Callback props
  onValuesChange?: (values: [number, number]) => void;
  onValuesChangeFinish?: (values: [number, number]) => void;
  onValuesChangeStart?: (values: [number, number]) => void;

  // Accessibility props
  leftThumbAccessibilityLabel?: string;
  rightThumbAccessibilityLabel?: string;

  // Visual props
  showThumbLines?: boolean;
}

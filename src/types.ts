import type { ViewStyle } from 'react-native';

export interface RangeSliderProps {
  // Core props
  values: [number, number];
  min: number;
  max: number;
  step?: number;

  // Style props
  selectedStyle?: ViewStyle;
  unselectedStyle?: ViewStyle;
  markerStyle?: ViewStyle;
  pressedMarkerStyle?: ViewStyle;
  containerStyle?: ViewStyle;

  // Customization props
  sliderWidth?: number;
  markerSize?: number;
  trackHeight?: number;
  minimumDistance?: number;
  markerColor?: string;
  selectedTrackColor?: string;
  unselectedTrackColor?: string;

  // Behavior props
  enabled?: boolean;
  snapsToStep?: boolean;
  allowOverlap?: boolean;

  // Callback props
  onValuesChange?: (values: [number, number]) => void;
  onValuesChangeFinish?: (values: [number, number]) => void;
  onValuesChangeStart?: (values: [number, number]) => void;

  // Accessibility props
  leftMarkerAccessibilityLabel?: string;
  rightMarkerAccessibilityLabel?: string;
}

import React, {
  useState,
  useCallback,
  forwardRef,
  useEffect,
  useMemo,
} from 'react';
import { View, StyleSheet } from 'react-native';
import {
  PanGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';

// ================ Constants ================
const HORIZONTAL_PADDING = 15;
const TOUCH_HITSLOP = { top: 20, bottom: 20, left: 20, right: 20 };
const MIN_THUMB_SPACING = 16;

const DEFAULT_VALUES = {
  WIDTH: 270,
  THUMB_SIZE: 32,
  TRACK_HEIGHT: 2.5,
  STEP: 1,
  LEFT_THUMB_LABEL: 'Left handle',
  RIGHT_THUMB_LABEL: 'Right handle',
  MINIMUM_DISTANCE: MIN_THUMB_SPACING,
  SHOW_THUMB_LINES: true,
};

// ================ Styles ================
const styles = StyleSheet.create({
  markerContainer: {
    overflow: 'visible',
  },
});

const staticStyles = StyleSheet.create({
  container: {
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  markerLine: {
    width: 1,
    height: 12,
    backgroundColor: '#8E8E8E',
    marginHorizontal: 2,
  },
  thumbInner: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
});

const createDynamicStyles = (props) => ({
  root: {
    width: props.width + HORIZONTAL_PADDING * 2,
    alignSelf: 'center',
  },
  track: {
    position: 'absolute',
    height: props.trackHeight,
    width: props.width,
    left: HORIZONTAL_PADDING,
  },
  selectedTrack: {
    position: 'absolute',
    height: props.trackHeight,
  },
  thumb: {
    height: props.thumbSize,
    width: props.thumbSize,
    borderRadius: props.thumbSize / 2,
    backgroundColor: 'white',
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -(props.thumbSize / 2),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    opacity: props.enabled ? 1 : 0.5,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
  },
});

// ================ Component ================
const RangeSlider = forwardRef(
  (
    {
      // Core props
      initialMinValue,
      initialMaxValue,
      min,
      max,
      step = DEFAULT_VALUES.STEP,

      // Style props
      selectedTrackStyle,
      unselectedTrackStyle,
      thumbStyle,
      pressedThumbStyle,
      containerStyle,
      selectedTrackColor,

      // Customization props
      width = DEFAULT_VALUES.WIDTH, // Set default here
      thumbSize = DEFAULT_VALUES.THUMB_SIZE,
      trackHeight = DEFAULT_VALUES.TRACK_HEIGHT,
      minimumDistance = DEFAULT_VALUES.MINIMUM_DISTANCE,

      // Behavior props
      enabled = true,
      allowOverlap = false,

      // Callback props
      onValuesChange = () => {},
      onValuesChangeFinish = () => {},
      onValuesChangeStart = () => {},

      // Accessibility props
      leftThumbAccessibilityLabel = DEFAULT_VALUES.LEFT_THUMB_LABEL,
      rightThumbAccessibilityLabel = DEFAULT_VALUES.RIGHT_THUMB_LABEL,

      // Visual props
      showThumbLines = DEFAULT_VALUES.SHOW_THUMB_LINES,
    },
    ref
  ) => {
    // Track pressed state
    const [pressed, setPressed] = useState({ left: false, right: false });

    // Memoize effective width calculation
    const effectiveSliderWidth = useMemo(
      () => width || DEFAULT_VALUES.WIDTH,
      [width]
    );

    // Memoize initial values and positions
    const initialPositions = useMemo(() => {
      const leftValue = Math.max(min, Math.min(max, initialMinValue ?? min));
      const rightValue = Math.max(min, Math.min(max, initialMaxValue ?? max));

      const normalizedLeft = (leftValue - min) / (max - min);
      const normalizedRight = (rightValue - min) / (max - min);

      return {
        left: HORIZONTAL_PADDING + normalizedLeft * effectiveSliderWidth,
        right: HORIZONTAL_PADDING + normalizedRight * effectiveSliderWidth,
      };
    }, [min, max, initialMinValue, initialMaxValue, effectiveSliderWidth]);

    // Initialize shared values with correct positions immediately
    const leftPos = useSharedValue(initialPositions.left);
    const rightPos = useSharedValue(initialPositions.right);
    const leftOffset = useSharedValue(initialPositions.left);
    const rightOffset = useSharedValue(initialPositions.right);

    // For position calculations
    const calculatePosition = useCallback(
      (value) => {
        'worklet';
        const normalizedValue = (value - min) / (max - min);
        const position =
          HORIZONTAL_PADDING + normalizedValue * effectiveSliderWidth;
        return position;
      },
      [min, max, effectiveSliderWidth]
    );

    const leftTransform = useDerivedValue(() => {
      'worklet';
      return [{ translateX: leftPos.value - HORIZONTAL_PADDING }];
    });

    const rightTransform = useDerivedValue(() => {
      'worklet';
      return [{ translateX: rightPos.value - HORIZONTAL_PADDING }];
    });

    const trackStyle = useDerivedValue(() => {
      'worklet';
      return {
        left: leftPos.value,
        width: rightPos.value - leftPos.value,
      };
    });

    const leftThumbStyle = useAnimatedStyle(() => ({
      transform: leftTransform.value,
    }));

    const rightThumbStyle = useAnimatedStyle(() => ({
      transform: rightTransform.value,
    }));

    const animatedTrackStyle = useAnimatedStyle(() => ({
      left: trackStyle.value.left,
      width: trackStyle.value.width,
    }));

    const convertPositionToValue = useCallback(
      (position) => {
        'worklet';
        const value =
          min +
          ((position - HORIZONTAL_PADDING) / effectiveSliderWidth) *
            (max - min);
        return value;
      },
      [min, max, effectiveSliderWidth]
    );

    const updateValues = useCallback(
      (leftPosition, rightPosition) => {
        'worklet';
        const leftValue = convertPositionToValue(leftPosition);
        const rightValue = convertPositionToValue(rightPosition);
        const rounded = [
          Math.round(leftValue / step) * step,
          Math.round(rightValue / step) * step,
        ];
        return rounded;
      },
      [convertPositionToValue, step]
    );

    // Handle value changes
    const updateOutputValues = useCallback(
      (values) => {
        onValuesChange(values);
      },
      [onValuesChange]
    );

    const leftGesture = useAnimatedGestureHandler({
      onStart: (_, ctx) => {
        'worklet';
        if (!enabled) return;
        ctx.startX = leftPos.value;
        runOnJS(setPressed)({ left: true, right: false });
        runOnJS(onValuesChangeStart)(
          updateValues(leftPos.value, rightPos.value)
        );
      },
      onActive: (event, ctx) => {
        'worklet';
        if (!enabled) return;

        const position = ctx.startX + event.translationX;
        const minPosition = HORIZONTAL_PADDING;
        const maxPosition = allowOverlap
          ? rightPos.value
          : rightPos.value - minimumDistance;

        const clampedPosition = Math.max(
          minPosition,
          Math.min(maxPosition, position)
        );

        // Update position directly without animation
        leftPos.value = clampedPosition;
        leftOffset.value = clampedPosition;

        const newValues = updateValues(clampedPosition, rightPos.value);
        runOnJS(updateOutputValues)(newValues);
      },
      onEnd: () => {
        'worklet';
        if (!enabled) return;

        const values = updateValues(leftPos.value, rightPos.value);
        const leftValue = values[0];
        const newLeftPos = calculatePosition(leftValue);

        leftPos.value = newLeftPos;
        leftOffset.value = newLeftPos;

        runOnJS(onValuesChangeFinish)(values);
        runOnJS(setPressed)({ left: false, right: false });
      },
    });

    const rightGesture = useAnimatedGestureHandler({
      onStart: (_, ctx) => {
        'worklet';
        if (!enabled) return;
        ctx.startX = rightPos.value;
        runOnJS(setPressed)({ left: false, right: true });
        runOnJS(onValuesChangeStart)(
          updateValues(leftPos.value, rightPos.value)
        );
      },
      onActive: (event, ctx) => {
        'worklet';
        if (!enabled) return;

        const position = ctx.startX + event.translationX;
        const minPosition = allowOverlap
          ? leftPos.value
          : leftPos.value + minimumDistance;
        const maxPosition = effectiveSliderWidth + HORIZONTAL_PADDING;

        const clampedPosition = Math.max(
          minPosition,
          Math.min(maxPosition, position)
        );

        // Update position directly without animation
        rightPos.value = clampedPosition;
        rightOffset.value = clampedPosition;

        const newValues = updateValues(leftPos.value, clampedPosition);
        runOnJS(updateOutputValues)(newValues);
      },
      onEnd: () => {
        'worklet';
        if (!enabled) return;

        const values = updateValues(leftPos.value, rightPos.value);
        const rightValue = values[1];
        const newRightPos = calculatePosition(rightValue);

        rightPos.value = newRightPos;
        rightOffset.value = newRightPos;

        runOnJS(onValuesChangeFinish)(values);
        runOnJS(setPressed)({ left: false, right: false });
      },
    });

    const updatePositions = useCallback(() => {
      if (!pressed.left && !pressed.right) {
        leftPos.value = initialPositions.left;
        rightPos.value = initialPositions.right;
        leftOffset.value = initialPositions.left;
        rightOffset.value = initialPositions.right;
      }
    }, [pressed, initialPositions, leftPos, rightPos, leftOffset, rightOffset]);

    useEffect(() => {
      updatePositions();
    }, [updatePositions]);

    const dynamicStyles = createDynamicStyles({
      width: effectiveSliderWidth,
      thumbSize,
      trackHeight,
      enabled,
    });

    return (
      <GestureHandlerRootView
        style={[dynamicStyles.root, { direction: 'ltr' }]}
      >
        <View
          style={[staticStyles.container, containerStyle, { direction: 'ltr' }]}
        >
          <View
            style={[
              dynamicStyles.track,
              { backgroundColor: '#CECECE' },
              unselectedTrackStyle,
            ]}
          />

          <Animated.View
            style={[
              dynamicStyles.selectedTrack,
              {
                backgroundColor: selectedTrackColor || '#2196F3',
              },
              selectedTrackStyle,
              animatedTrackStyle,
            ]}
          />

          <PanGestureHandler
            onGestureEvent={leftGesture}
            hitSlop={TOUCH_HITSLOP}
            minDist={0}
            activeOffsetX={[-10, 10]}
          >
            <Animated.View
              accessible={true}
              accessibilityLabel={leftThumbAccessibilityLabel}
              accessibilityRole="adjustable"
              style={[
                dynamicStyles.thumb,
                styles.markerContainer,
                thumbStyle,
                pressed.left && pressedThumbStyle,
                leftThumbStyle,
              ]}
            >
              <View style={staticStyles.thumbInner}>
                {showThumbLines && (
                  <>
                    <View style={staticStyles.markerLine} />
                    <View style={staticStyles.markerLine} />
                    <View style={staticStyles.markerLine} />
                  </>
                )}
              </View>
            </Animated.View>
          </PanGestureHandler>

          <PanGestureHandler
            onGestureEvent={rightGesture}
            hitSlop={TOUCH_HITSLOP}
            minDist={0}
            activeOffsetX={[-10, 10]}
          >
            <Animated.View
              accessible={true}
              accessibilityLabel={rightThumbAccessibilityLabel}
              accessibilityRole="adjustable"
              style={[
                dynamicStyles.thumb,
                styles.markerContainer,
                thumbStyle,
                pressed.right && pressedThumbStyle,
                rightThumbStyle,
              ]}
            >
              <View style={staticStyles.thumbInner}>
                {showThumbLines && (
                  <>
                    <View style={staticStyles.markerLine} />
                    <View style={staticStyles.markerLine} />
                    <View style={staticStyles.markerLine} />
                  </>
                )}
              </View>
            </Animated.View>
          </PanGestureHandler>
        </View>
      </GestureHandlerRootView>
    );
  }
);

export default RangeSlider;

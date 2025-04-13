import React, { useState, useCallback, forwardRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
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
import PropTypes from 'prop-types';

// Layout constants
const HORIZONTAL_PADDING = 15;
const TOUCH_HITSLOP = { top: 20, bottom: 20, left: 20, right: 20 };
const MIN_THUMB_SPACING = 16;

// Default values constants
const DEFAULT_VALUES = {
  SLIDER_WIDTH: 270,
  THUMB_SIZE: 32,
  TRACK_HEIGHT: 2.5,
  STEP: 1,
  LEFT_THUMB_LABEL: 'Left handle',
  RIGHT_THUMB_LABEL: 'Right handle',
  MINIMUM_DISTANCE: MIN_THUMB_SPACING,
  SHOW_THUMB_LINES: true,
};

const createDynamicStyles = (props) => ({
  root: {
    width: props.sliderWidth + HORIZONTAL_PADDING * 2,
    alignSelf: 'center',
  },
  track: {
    position: 'absolute',
    height: props.trackHeight,
    width: props.sliderWidth,
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
    backgroundColor: 'white', // Move default color here
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    left: 0,
    top: '50%',
    marginTop: -(props.thumbSize / 2),
    borderWidth: 0.5,
    borderColor: '#CECECE',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    opacity: props.enabled ? 1 : 0.5,
  },
});

const RangeSlider = forwardRef(
  (
    {
      // Core props
      values,
      min,
      max,
      step = DEFAULT_VALUES.STEP,

      // Style props
      selectedTrackStyle,
      unselectedTrackStyle,
      thumbStyle,
      pressedThumbStyle,
      containerStyle,

      // Customization props
      sliderWidth = DEFAULT_VALUES.SLIDER_WIDTH,
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
    const [pressed, setPressed] = useState({ left: false, right: false });

    const calculatePosition = useCallback(
      (value) => {
        'worklet';
        const normalizedValue = (value - min) / (max - min);
        return HORIZONTAL_PADDING + normalizedValue * sliderWidth;
      },
      [min, max, sliderWidth]
    );

    const leftPos = useSharedValue(0);
    const rightPos = useSharedValue(0);
    const leftOffset = useSharedValue(0);
    const rightOffset = useSharedValue(0);

    useEffect(() => {
      const initialLeftPos = calculatePosition(values[0]);
      const initialRightPos = calculatePosition(values[1]);

      leftPos.value = initialLeftPos;
      rightPos.value = initialRightPos;
      leftOffset.value = initialLeftPos;
      rightOffset.value = initialRightPos;
    }, [calculatePosition, values, leftPos, rightPos, leftOffset, rightOffset]);

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
        return (
          min + ((position - HORIZONTAL_PADDING) / sliderWidth) * (max - min)
        );
      },
      [min, max, sliderWidth]
    );

    const updateValues = useCallback(
      (leftPosition, rightPosition) => {
        'worklet';
        const leftValue = convertPositionToValue(leftPosition);
        const rightValue = convertPositionToValue(rightPosition);

        // Always round values according to step size
        return [
          Math.round(leftValue / step) * step,
          Math.round(rightValue / step) * step,
        ];
      },
      [convertPositionToValue, step]
    );

    const leftGesture = useAnimatedGestureHandler({
      onStart: (_, ctx) => {
        'worklet';
        if (!enabled) return;
        ctx.startX = leftPos.value;
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
        leftPos.value = clampedPosition;
        runOnJS(onValuesChange)(updateValues(clampedPosition, rightPos.value));
      },
      onEnd: () => {
        'worklet';
        runOnJS(onValuesChangeFinish)(
          updateValues(leftPos.value, rightPos.value)
        );
        runOnJS(setPressed)({ left: false, right: false });
      },
    });

    const rightGesture = useAnimatedGestureHandler({
      onStart: (_, ctx) => {
        'worklet';
        if (!enabled) return;
        ctx.startX = rightPos.value;
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
        const maxPosition = sliderWidth + HORIZONTAL_PADDING;

        const clampedPosition = Math.max(
          minPosition,
          Math.min(maxPosition, position)
        );
        rightPos.value = clampedPosition;
        runOnJS(onValuesChange)(updateValues(leftPos.value, clampedPosition));
      },
      onEnd: () => {
        'worklet';
        runOnJS(onValuesChangeFinish)(
          updateValues(leftPos.value, rightPos.value)
        );
        runOnJS(setPressed)({ left: false, right: false });
      },
    });

    useEffect(() => {
      if (!pressed.left && !pressed.right) {
        const newLeftPos = calculatePosition(values[0]);
        const newRightPos = calculatePosition(values[1]);

        leftPos.value = newLeftPos;
        rightPos.value = newRightPos;
        leftOffset.value = newLeftPos;
        rightOffset.value = newRightPos;
      }
    }, [
      values,
      min,
      max,
      pressed,
      calculatePosition,
      leftPos,
      rightPos,
      leftOffset,
      rightOffset,
    ]);

    const dynamicStyles = createDynamicStyles({
      sliderWidth,
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
              { backgroundColor: '#CECECE' }, // Default color
              unselectedTrackStyle,
            ]}
          />

          <Animated.View
            style={[
              dynamicStyles.selectedTrack,
              { backgroundColor: '#2196F3' }, // Default color
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
              {showThumbLines && (
                <>
                  <View style={staticStyles.markerLine} />
                  <View style={staticStyles.markerLine} />
                  <View style={staticStyles.markerLine} />
                </>
              )}
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
              {showThumbLines && (
                <>
                  <View style={staticStyles.markerLine} />
                  <View style={staticStyles.markerLine} />
                  <View style={staticStyles.markerLine} />
                </>
              )}
            </Animated.View>
          </PanGestureHandler>
        </View>
      </GestureHandlerRootView>
    );
  }
);

const styles = StyleSheet.create({
  markerContainer: {
    ...Platform.select({
      ios: {
        zIndex: 1,
      },
      android: {
        elevation: 5,
      },
    }),
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
});

RangeSlider.propTypes = {
  // Core props
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number,

  // Style props
  selectedTrackStyle: PropTypes.object,
  unselectedTrackStyle: PropTypes.object,
  thumbStyle: PropTypes.object,
  pressedThumbStyle: PropTypes.object,
  containerStyle: PropTypes.object,

  // Customization props
  sliderWidth: PropTypes.number,
  thumbSize: PropTypes.number,
  trackHeight: PropTypes.number,
  minimumDistance: PropTypes.number,

  // Behavior props
  enabled: PropTypes.bool,
  allowOverlap: PropTypes.bool,

  // Callback props
  onValuesChange: PropTypes.func,
  onValuesChangeFinish: PropTypes.func,
  onValuesChangeStart: PropTypes.func,

  // Accessibility props
  leftThumbAccessibilityLabel: PropTypes.string,
  rightThumbAccessibilityLabel: PropTypes.string,

  // Visual props
  showThumbLines: PropTypes.bool,
};

RangeSlider.defaultProps = {
  step: DEFAULT_VALUES.STEP,
  sliderWidth: DEFAULT_VALUES.SLIDER_WIDTH,
  thumbSize: DEFAULT_VALUES.THUMB_SIZE,
  trackHeight: DEFAULT_VALUES.TRACK_HEIGHT,
  enabled: true,
  allowOverlap: false,
  onValuesChange: () => {},
  onValuesChangeFinish: () => {},
  onValuesChangeStart: () => {},
  leftThumbAccessibilityLabel: DEFAULT_VALUES.LEFT_THUMB_LABEL,
  rightThumbAccessibilityLabel: DEFAULT_VALUES.RIGHT_THUMB_LABEL,
  showThumbLines: DEFAULT_VALUES.SHOW_THUMB_LINES,
};

export default RangeSlider;

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
const MIN_MARKER_SPACING = 16;

// Default values constants
const DEFAULT_VALUES = {
  SLIDER_WIDTH: 270,
  MARKER_SIZE: 32,
  TRACK_HEIGHT: 2.5,
  STEP: 1,
  MARKER_COLOR: 'white',
  SELECTED_TRACK_COLOR: '#2196F3',
  UNSELECTED_TRACK_COLOR: '#CECECE',
  LEFT_MARKER_LABEL: 'Left handle',
  RIGHT_MARKER_LABEL: 'Right handle',
  MINIMUM_DISTANCE: MIN_MARKER_SPACING,
};

const createDynamicStyles = (props) => ({
  root: {
    width: props.sliderWidth + HORIZONTAL_PADDING * 2,
    alignSelf: 'center',
  },
  track: {
    position: 'absolute',
    height: props.trackHeight,
    backgroundColor: props.unselectedTrackColor,
    width: props.sliderWidth,
    left: HORIZONTAL_PADDING,
  },
  selectedTrack: {
    position: 'absolute',
    height: props.trackHeight,
    backgroundColor: props.selectedTrackColor,
  },
  marker: {
    height: props.markerSize,
    width: props.markerSize,
    borderRadius: props.markerSize / 2,
    backgroundColor: props.markerColor,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    left: 0,
    top: '50%',
    marginTop: -(props.markerSize / 2),
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
      selectedStyle,
      unselectedStyle,
      markerStyle,
      pressedMarkerStyle,
      containerStyle,

      // Customization props
      sliderWidth = DEFAULT_VALUES.SLIDER_WIDTH,
      markerSize = DEFAULT_VALUES.MARKER_SIZE,
      trackHeight = DEFAULT_VALUES.TRACK_HEIGHT,
      minimumDistance = DEFAULT_VALUES.MINIMUM_DISTANCE,
      markerColor = DEFAULT_VALUES.MARKER_COLOR,
      selectedTrackColor = DEFAULT_VALUES.SELECTED_TRACK_COLOR,
      unselectedTrackColor = DEFAULT_VALUES.UNSELECTED_TRACK_COLOR,

      // Behavior props
      enabled = true,
      snapsToStep = false,
      allowOverlap = false,

      // Callback props
      onValuesChange = () => {},
      onValuesChangeFinish = () => {},
      onValuesChangeStart = () => {},

      // Accessibility props
      leftMarkerAccessibilityLabel = DEFAULT_VALUES.LEFT_MARKER_LABEL,
      rightMarkerAccessibilityLabel = DEFAULT_VALUES.RIGHT_MARKER_LABEL,
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

    const leftMarkerStyle = useAnimatedStyle(() => ({
      transform: leftTransform.value,
    }));

    const rightMarkerStyle = useAnimatedStyle(() => ({
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

        if (snapsToStep) {
          return [
            Math.round(leftValue / step) * step,
            Math.round(rightValue / step) * step,
          ];
        }
        return [leftValue, rightValue];
      },
      [convertPositionToValue, step, snapsToStep]
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
      markerSize,
      trackHeight,
      markerColor,
      selectedTrackColor,
      unselectedTrackColor,
      enabled,
    });

    return (
      <GestureHandlerRootView
        style={[dynamicStyles.root, { direction: 'ltr' }]}
      >
        <View
          style={[staticStyles.container, containerStyle, { direction: 'ltr' }]}
        >
          <View style={[dynamicStyles.track, unselectedStyle]} />

          <Animated.View
            style={[
              dynamicStyles.selectedTrack,
              selectedStyle,
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
              accessibilityLabel={leftMarkerAccessibilityLabel}
              accessibilityRole="adjustable"
              style={[
                dynamicStyles.marker,
                styles.markerContainer,
                markerStyle,
                pressed.left && pressedMarkerStyle,
                leftMarkerStyle,
              ]}
            >
              <View style={staticStyles.markerLine} />
              <View style={staticStyles.markerLine} />
              <View style={staticStyles.markerLine} />
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
              accessibilityLabel={rightMarkerAccessibilityLabel}
              accessibilityRole="adjustable"
              style={[
                dynamicStyles.marker,
                styles.markerContainer,
                markerStyle,
                pressed.right && pressedMarkerStyle,
                rightMarkerStyle,
              ]}
            >
              <View style={staticStyles.markerLine} />
              <View style={staticStyles.markerLine} />
              <View style={staticStyles.markerLine} />
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
  selectedStyle: PropTypes.object,
  unselectedStyle: PropTypes.object,
  markerStyle: PropTypes.object,
  pressedMarkerStyle: PropTypes.object,
  containerStyle: PropTypes.object,

  // Customization props
  sliderWidth: PropTypes.number,
  markerSize: PropTypes.number,
  trackHeight: PropTypes.number,
  minimumDistance: PropTypes.number,
  markerColor: PropTypes.string,
  selectedTrackColor: PropTypes.string,
  unselectedTrackColor: PropTypes.string,

  // Behavior props
  enabled: PropTypes.bool,
  snapsToStep: PropTypes.bool,
  allowOverlap: PropTypes.bool,

  // Callback props
  onValuesChange: PropTypes.func,
  onValuesChangeFinish: PropTypes.func,
  onValuesChangeStart: PropTypes.func,

  // Accessibility props
  leftMarkerAccessibilityLabel: PropTypes.string,
  rightMarkerAccessibilityLabel: PropTypes.string,
};

RangeSlider.defaultProps = {
  step: DEFAULT_VALUES.STEP,
  sliderWidth: DEFAULT_VALUES.SLIDER_WIDTH,
  markerSize: DEFAULT_VALUES.MARKER_SIZE,
  trackHeight: DEFAULT_VALUES.TRACK_HEIGHT,
  enabled: true,
  snapsToStep: false,
  allowOverlap: false,
  markerColor: DEFAULT_VALUES.MARKER_COLOR,
  selectedTrackColor: DEFAULT_VALUES.SELECTED_TRACK_COLOR,
  unselectedTrackColor: DEFAULT_VALUES.UNSELECTED_TRACK_COLOR,
  onValuesChange: () => {},
  onValuesChangeFinish: () => {},
  onValuesChangeStart: () => {},
  leftMarkerAccessibilityLabel: DEFAULT_VALUES.LEFT_MARKER_LABEL,
  rightMarkerAccessibilityLabel: DEFAULT_VALUES.RIGHT_MARKER_LABEL,
};

export default RangeSlider;

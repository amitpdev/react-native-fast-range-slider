# React Native Range Slider

A high-performance React Native range slider component built with react-native-reanimated and react-native-gesture-handler for smooth animations and precise touch control.

## Features

- 🚀 High performance using react-native-reanimated
- 🎯 Precise touch controls with react-native-gesture-handler
- 💨 Smooth animations running on UI thread
- 🔄 Real-time value updates
- 🎨 Fully customizable styling
- ♿️ Accessibility support
- 📱 Pure JavaScript implementation
- 🔧 Configurable min/max values and step sizes
- 🎛 Support for minimum distance between markers
- 🔒 Optional snap-to-step behavior
- 🌐 RTL (Right-to-Left) support (automatic)

## Performance Benefits

This slider leverages two powerful libraries for optimal performance:

- **react-native-reanimated**: Runs animations directly on the UI thread, eliminating JS-bridge overhead and ensuring smooth 60 FPS animations even during complex interactions
- **react-native-gesture-handler**: Provides native-driven gesture handling, resulting in more responsive touch interactions compared to React Native's PanResponder

## Installation

```bash
npm install react-native-range-slider
# or
yarn add react-native-range-slider
```

### Dependencies

This library requires:
```bash
yarn add react-native-reanimated react-native-gesture-handler
```

## Usage

```javascript
import RangeSlider from 'react-native-range-slider';

const YourComponent = () => {
  const handleValuesChange = (values) => {
    console.log('Current values:', values);
  };

  return (
    <RangeSlider
      values={[20, 80]}
      min={0}
      max={100}
      step={1}
      onValuesChange={handleValuesChange}
      // Customize appearance
      selectedTrackColor="#2196F3"
      unselectedTrackColor="#CECECE"
      markerColor="white"
      // Optional behavior props
      snapsToStep={true}
      allowOverlap={false}
    />
  );
};
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| values | [number, number] | Yes | - | Current values array [min, max] |
| min | number | Yes | - | Minimum allowed value |
| max | number | Yes | - | Maximum allowed value |
| step | number | No | 1 | Step size for value changes |
| sliderWidth | number | No | 270 | Width of the slider track |
| markerSize | number | No | 32 | Size of marker handles |
| trackHeight | number | No | 2.5 | Height of slider track |
| minimumDistance | number | No | 16 | Minimum distance between markers |
| enabled | boolean | No | true | Enable/disable slider |
| snapsToStep | boolean | No | false | Snap values to steps |
| allowOverlap | boolean | No | false | Allow markers to overlap |

## Styling

The component is highly customizable through style props:

```javascript
<RangeSlider
  // Colors
  selectedTrackColor="#2196F3"
  unselectedTrackColor="#CECECE"
  markerColor="white"
  
  // Custom styles
  selectedStyle={{...}}
  unselectedStyle={{...}}
  markerStyle={{...}}
  pressedMarkerStyle={{...}}
  containerStyle={{...}}
/>
```

## Callbacks

```javascript
<RangeSlider
  onValuesChange={(values) => {
    // Called while dragging
  }}
  onValuesChangeStart={(values) => {
    // Called when drag starts
  }}
  onValuesChangeFinish={(values) => {
    // Called when drag ends
  }}
/>
```

## Accessibility

The slider supports screen readers with customizable labels:

```javascript
<RangeSlider
  leftMarkerAccessibilityLabel="Minimum value"
  rightMarkerAccessibilityLabel="Maximum value"
/>
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
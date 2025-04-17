import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import RangeSlider from 'react-native-range-slider-fast';

function App() {
  const MIN = 0;
  const MAX = 500;
  const STEP = 1;
  const [values, setValues] = useState([MIN, MAX]);
  const [finalValues, setFinalValues] = useState([MIN, MAX]);

  const resetSlider = () => {
    setValues([MIN, MAX]);
    setFinalValues([MIN, MAX]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Text style={styles.title}>Range Slider Example</Text>

      <View style={styles.sliderContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.sliderLabel}>
            Current Selection: {values[0]} - {values[1]}
          </Text>
          <Text style={styles.labelEvent}>(onValuesChange)</Text>
        </View>

        <RangeSlider
          initialMinValue={values[0]}
          initialMaxValue={values[1]}
          min={MIN}
          max={MAX}
          step={STEP}
          width={280}
          selectedTrackColor="#8A2BE2"
          onValuesChange={setValues}
          onValuesChangeFinish={setFinalValues}
        />

        <View style={styles.labelContainer}>
          <Text style={styles.sliderRange}>
            Selected Range: {finalValues[0]} - {finalValues[1]}
          </Text>
          <Text style={styles.rangeEvent}>(onValuesChangeFinish)</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button title="Reset Slider" onPress={resetSlider} color="#8A2BE2" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  sliderContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
  },
  sliderRange: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8A2BE2',
  },
  buttonContainer: {
    marginTop: 20,
    width: 280,
  },
  labelContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  labelEvent: {
    fontSize: 15,
    color: '#777',
    marginTop: 4,
  },
  rangeEvent: {
    fontSize: 15,
    color: '#9C6ADE',
    marginTop: 4,
  },
});

export default App;

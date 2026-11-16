
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Text as SvgText,
} from 'react-native-svg';

const COLORS = [
  '#EF4444',
  '#F59E0B',
  '#22C55E',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
];

export default function SpinWheel({ options, onResult }) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const locked = useRef(false);
  const [spinning, setSpinning] = useState(false);

  const SIZE = 290;
  const CENTER = SIZE / 2;
  const RADIUS = 140;
  const anglePerSlice = 360 / options.length;

  const rotation = spinValue.interpolate({
    inputRange: [0, 2520],
    outputRange: ['0deg', '2520deg'],
  });

  function spin() {
    if (locked.current || options.length === 0) return;

    locked.current = true;
    setSpinning(true);

    const winner = Math.floor(Math.random() * options.length);

    // Stop the winning slice under the top pointer.
    const targetAngle =
      360 * 6 + 360 - (winner + 0.5) * anglePerSlice;

    spinValue.setValue(0);

    Animated.timing(spinValue, {
      toValue: targetAngle,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      locked.current = false;
      setSpinning(false);

      if (finished) {
        onResult(options[winner]);
      }
    });
  }

  function drawSlices() {
    return options.map((option, index) => {
      const startAngle =
        (-90 + index * anglePerSlice) * Math.PI / 180;

      const endAngle =
        (-90 + (index + 1) * anglePerSlice) * Math.PI / 180;

      const middleAngle = (startAngle + endAngle) / 2;

      const x1 = CENTER + RADIUS * Math.cos(startAngle);
      const y1 = CENTER + RADIUS * Math.sin(startAngle);
      const x2 = CENTER + RADIUS * Math.cos(endAngle);
      const y2 = CENTER + RADIUS * Math.sin(endAngle);

      const textX = CENTER + 92 * Math.cos(middleAngle);
      const textY = CENTER + 92 * Math.sin(middleAngle);

      const path = `
        M ${CENTER} ${CENTER}
        L ${x1} ${y1}
        A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2}
        Z
      `;

      const label = String(option);
      const shortLabel =
        label.length > 11 ? label.slice(0, 10) + '…' : label;

      return (
        <React.Fragment key={index}>
          <Path
            d={path}
            fill={COLORS[index % COLORS.length]}
            stroke="#FFFFFF"
            strokeWidth={2}
          />

          <SvgText
            x={textX}
            y={textY}
            fill="#FFFFFF"
            fontSize={11}
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {shortLabel}
          </SvgText>
        </React.Fragment>
      );
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pointer}>▼</Text>

      <Animated.View
        style={{ transform: [{ rotate: rotation }] }}
      >
        <Svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
        >
          {drawSlices()}

          <Circle
            cx={CENTER}
            cy={CENTER}
            r={14}
            fill="#0F172A"
            stroke="white"
            strokeWidth={3}
          />
        </Svg>
      </Animated.View>

      <TouchableOpacity
        style={[
          styles.button,
          spinning && styles.disabledButton,
        ]}
        onPress={spin}
        disabled={spinning}
      >
        <Text style={styles.buttonText}>
          {spinning ? 'SPINNING...' : 'SPIN'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  pointer: {
    fontSize: 32,
    color: '#FACC15',
    marginBottom: -5,
    zIndex: 2,
  },
  button: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    paddingHorizontal: 65,
    borderRadius: 12,
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import WheelPicker from './WheelPicker';

interface Props {
  value: Date;
  onChange: (date: Date) => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function DateTimeWheel({ value, onChange }: Props) {
  const year = value.getFullYear();
  const month = value.getMonth() + 1;
  const day = value.getDate();
  const hour = value.getHours();
  const minute = value.getMinutes();

  const years = useMemo(
    () =>
      range(2020, 2040).map((v) => ({
        label: `${v}年`,
        value: v,
      })),
    []
  );

  const months = useMemo(
    () =>
      range(1, 12).map((v) => ({
        label: `${v}月`,
        value: v,
      })),
    []
  );

  const daysInMonth = getDaysInMonth(year, month);
  const days = useMemo(
    () =>
      range(1, daysInMonth).map((v) => ({
        label: `${v}日`,
        value: v,
      })),
    [daysInMonth]
  );

  const hours = useMemo(
    () =>
      range(0, 23).map((v) => ({
        label: `${v}时`,
        value: v,
      })),
    []
  );

  const minutes = useMemo(
    () =>
      range(0, 59).map((v) => ({
        label: `${v}分`,
        value: v,
      })),
    []
  );

  const clampDay = (y: number, m: number, d: number) => {
    const max = getDaysInMonth(y, m);
    return Math.min(d, max);
  };

  const handleYearChange = (v: number) => {
    const d = new Date(value);
    d.setFullYear(v);
    d.setDate(clampDay(v, month, day));
    onChange(d);
  };

  const handleMonthChange = (v: number) => {
    const d = new Date(value);
    d.setMonth(v - 1);
    d.setDate(clampDay(year, v, day));
    onChange(d);
  };

  const handleDayChange = (v: number) => {
    const d = new Date(value);
    d.setDate(v);
    onChange(d);
  };

  const handleHourChange = (v: number) => {
    const d = new Date(value);
    d.setHours(v);
    onChange(d);
  };

  const handleMinuteChange = (v: number) => {
    const d = new Date(value);
    d.setMinutes(v);
    onChange(d);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.wheelWrapper}>
          <WheelPicker items={years} selectedValue={year} onValueChange={handleYearChange} />
        </View>
        <View style={styles.wheelWrapper}>
          <WheelPicker items={months} selectedValue={month} onValueChange={handleMonthChange} />
        </View>
        <View style={styles.wheelWrapper}>
          <WheelPicker items={days} selectedValue={day} onValueChange={handleDayChange} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.wheelWrapper}>
          <WheelPicker items={hours} selectedValue={hour} onValueChange={handleHourChange} loop />
        </View>
        <View style={styles.wheelWrapper}>
          <WheelPicker items={minutes} selectedValue={minute} onValueChange={handleMinuteChange} loop />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFD1BA',
    overflow: 'hidden',
    flexDirection: 'row',
    padding: 4,
    gap: 2,
  },
  wheelWrapper: {
    flex: 1,
  },
});

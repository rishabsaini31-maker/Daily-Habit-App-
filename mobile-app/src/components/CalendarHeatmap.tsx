import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { HeatmapDay } from '../types';

interface CalendarHeatmapProps {
  currentMonth: Date;
  heatmapData: HeatmapDay[];
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

const DAYS_HEADER = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  currentMonth,
  heatmapData,
  onPrevMonth,
  onNextMonth,
}) => {
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Map heatmap data by day number
  const dataMap = new Map<string, HeatmapDay>();
  heatmapData.forEach(item => {
    dataMap.set(item.date, item);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // First day of month (0 = Sunday, 1 = Monday, ...)
  const firstDay = new Date(year, month, 1).getDay();
  // Total days in month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Build grid cells (padding blanks + days)
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push(d);
  }

  const getCellColor = (day: number | null) => {
    if (!day) return 'transparent';
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = dataMap.get(dateStr);

    if (!entry) return '#1e293b';

    switch (entry.status) {
      case 'FULL':
        return '#10b981'; // Emerald
      case 'PARTIAL':
        return '#0284c7'; // Sky / Blue
      case 'MISSED':
        return '#e11d48'; // Rose / Red
      case 'OFF_DAY':
      default:
        return '#334155'; // Dark slate
    }
  };

  return (
    <View style={styles.container}>
      {/* Month Navigation Header */}
      <View style={styles.header}>
        <Text style={styles.monthTitle}>{monthName}</Text>
        <View style={styles.navControls}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={onPrevMonth}
            accessibilityLabel="Previous month"
          >
            <ChevronLeft size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={onNextMonth}
            accessibilityLabel="Next month"
          >
            <ChevronRight size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekday Labels Header */}
      <View style={styles.daysHeaderRow}>
        {DAYS_HEADER.map((d, index) => (
          <Text key={index} style={styles.weekdayLabel}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grid of days */}
      <View style={styles.grid}>
        {cells.map((day, idx) => (
          <View key={idx} style={styles.cellWrapper}>
            {day !== null ? (
              <View style={[styles.dayCell, { backgroundColor: getCellColor(day) }]}>
                <Text
                  style={[
                    styles.dayNumberText,
                    getCellColor(day) === '#10b981' || getCellColor(day) === '#0284c7'
                      ? styles.dayTextLight
                      : styles.dayTextMuted,
                  ]}
                >
                  {day}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyCell} />
            )}
          </View>
        ))}
      </View>

      {/* Heatmap Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>100% Full</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#0284c7' }]} />
          <Text style={styles.legendText}>Partial</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#e11d48' }]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#334155' }]} />
          <Text style={styles.legendText}>Rest / Off</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  navControls: {
    flexDirection: 'row',
    gap: 6,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellWrapper: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 3,
  },
  dayCell: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCell: {
    flex: 1,
  },
  dayNumberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dayTextLight: {
    color: '#ffffff',
  },
  dayTextMuted: {
    color: '#94a3b8',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
